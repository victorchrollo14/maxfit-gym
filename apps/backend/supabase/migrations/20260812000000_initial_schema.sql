create table user_profiles (
  id       uuid primary key references auth.users(id)
             on update cascade on delete cascade,
  name     text not null default '',
  phone    text not null,
  email    text,
  phone_verified_at timestamptz,
  avatar            text,
  gender            text,
  dob               date,
  notes             text,

  created_by uuid references user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, name, phone, email, phone_verified_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.phone,
    new.email,
    new.phone_confirmed_at
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function handle_user_updated()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.user_profiles
     set phone             = new.phone,
         email             = new.email,
         phone_verified_at = new.phone_confirmed_at,
         updated_at        = now()
   where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of phone, email, phone_confirmed_at on auth.users
  for each row execute function handle_user_updated();

create or replace function has_claim(claim text)
returns boolean language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb
      -> 'app_metadata' -> claim = 'true'::jsonb,
    false
  );
$$;

create or replace function today_ist()
returns date language sql stable
as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

create table plans (
  id                 uuid primary key default gen_random_uuid(),
  family             text not null,
  name               text not null,
  duration_days      int  not null check (duration_days > 0),
  price              numeric(10,2) not null check (price >= 0),
  max_seats          int  not null default 1 check (max_seats > 0),
  pause_days_allowed int  not null default 0 check (pause_days_allowed >= 0),
  is_active          boolean not null default true,
  replaces_plan_id   uuid references plans(id),
  created_at         timestamptz not null default now()
);

create table memberships (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references plans(id),
  start_date      date not null,
  end_date        date not null,
  discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  discount_reason text,
  created_by      uuid references user_profiles(id) on delete set null,
  created_at      timestamptz not null default now(),

  check (end_date >= start_date)
);

create table membership_users (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references memberships(id) on delete restrict,
  user_id       uuid not null references user_profiles(id) on delete restrict,
  status        text not null default 'active'
                  check (status in ('active', 'cancelled')),
  created_at    timestamptz not null default now(),

  unique (membership_id, user_id)
);

create or replace function is_membership_user(_membership_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from membership_users
    where membership_id = _membership_id and user_id = _user_id
  );
$$;

create table pause_days (
  id                 uuid primary key default gen_random_uuid(),
  membership_id      uuid not null references memberships(id) on delete cascade,
  paused_from        date not null,
  paused_to          date not null,
  requested_on       date not null default today_ist(),
  requested_by       uuid references user_profiles(id) on delete set null,
  resumed_early_on   date,
  created_at         timestamptz not null default now(),

  check (paused_to >= paused_from)
);

create extension if not exists btree_gist;

alter table pause_days add constraint pause_days_no_overlap
  exclude using gist (
    membership_id with =,
    daterange(paused_from, paused_to, '[]') with &&
  );

create or replace function check_pause_allowance()
returns trigger language plpgsql as $$
declare
  v_allowed int;
  v_used    int;
begin
  select pl.pause_days_allowed into v_allowed
    from memberships m
    join plans pl on pl.id = m.plan_id
   where m.id = new.membership_id;

  select coalesce(sum(paused_to - paused_from + 1), 0) into v_used
    from pause_days
   where membership_id = new.membership_id
     and id <> new.id;

  if v_used + (new.paused_to - new.paused_from + 1) > v_allowed then
    raise exception 'pause allowance exceeded: % of % days already used',
      v_used, v_allowed
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger pause_days_allowance
  before insert or update on pause_days
  for each row execute function check_pause_allowance();

create or replace function request_pause(_membership_id uuid, _end_date date)
returns pause_days
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_from  date := today_ist() + 1;
  v_used  int;
  v_end   date;
  v_row   pause_days;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  if not (has_claim('admin') or is_membership_user(_membership_id, v_uid)) then
    raise exception 'not your membership' using errcode = 'insufficient_privilege';
  end if;

  if _end_date < v_from then
    raise exception 'pause must end on or after %', v_from
      using errcode = 'check_violation';
  end if;

  select coalesce(sum(paused_to - paused_from + 1), 0) into v_used
    from pause_days where membership_id = _membership_id;

  select m.end_date + v_used into v_end
    from memberships m where m.id = _membership_id;

  if v_from > v_end then
    raise exception 'membership is not active' using errcode = 'check_violation';
  end if;

  insert into pause_days (membership_id, paused_from, paused_to, requested_by)
  values (_membership_id, v_from, _end_date, v_uid)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function resume_pause(_pause_id uuid)
returns pause_days
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_today date := today_ist();
  v_row   pause_days;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  select * into v_row from pause_days where id = _pause_id;

  if v_row.id is null then
    raise exception 'no such pause' using errcode = 'no_data_found';
  end if;

  if not (has_claim('admin') or is_membership_user(v_row.membership_id, v_uid)) then
    raise exception 'not your membership' using errcode = 'insufficient_privilege';
  end if;

  if v_row.paused_to < v_today then
    raise exception 'pause already ended' using errcode = 'check_violation';
  end if;

  if v_today <= v_row.paused_from then
    delete from pause_days where id = _pause_id;
    return v_row;
  end if;

  update pause_days
     set paused_to       = v_today - 1,
         resumed_early_on = v_today
   where id = _pause_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function request_pause(uuid, date) from public;
revoke execute on function resume_pause(uuid)        from public;
grant  execute on function request_pause(uuid, date) to authenticated;
grant  execute on function resume_pause(uuid)        to authenticated;

create table payments (
  id             uuid primary key default gen_random_uuid(),
  membership_id  uuid references memberships(id),
  paid_by        uuid not null references user_profiles(id) on delete restrict,
  amount         numeric(10,2) not null check (amount > 0),
  method         text not null
                 check (method in ('upi', 'cash', 'card')),
  reference_id   text,
  status         text not null default 'pending'
                 check (status in ('pending', 'paid', 'failed', 'refunded')),
  marked_by      uuid references user_profiles(id) on delete set null,
  reconciled_at  timestamptz,
  invoice_number text unique,
  invoice_url    text,
  created_at     timestamptz not null default now()
);

create unique index payments_reference_uniq
  on payments(method, reference_id) where reference_id is not null;

create sequence invoice_seq;

create table leads (
  id     uuid primary key default gen_random_uuid(),
  name   text not null check (length(btrim(name)) between 1 and 120),
  phone  text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email  text check (email is null or length(email) <= 254),

  source text not null default 'free_trial'
           check (source in ('free_trial', 'call', 'whatsapp', 'walk_in', 'referral')),

  status text not null default 'new'
           check (status in ('new', 'hot', 'warm', 'cold', 'converted', 'lost')),

  notes text,

  user_id      uuid references user_profiles(id) on delete set null,
  converted_at timestamptz,

  admin_id   uuid references user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),

  check ((status = 'converted') = (converted_at is not null))
);

alter table user_profiles    enable row level security;
alter table plans            enable row level security;
alter table memberships      enable row level security;
alter table membership_users enable row level security;
alter table pause_days       enable row level security;
alter table payments         enable row level security;
alter table leads            enable row level security;

create policy "SELECT" on user_profiles for select to authenticated
  using ((select auth.uid()) = id or (select has_claim('admin')));

  create policy "INSERT" on user_profiles for insert to authenticated
  with check ((select has_claim('admin')));

  create policy "UPDATE" on user_profiles for update to authenticated
  using ((select auth.uid()) = id or (select has_claim('admin')));

create policy "SELECT" on plans for select to authenticated using (true);
create policy "INSERT" on plans for insert to authenticated
  with check ((select has_claim('plans_admin')));
create policy "UPDATE" on plans for update to authenticated
  using ((select has_claim('plans_admin')));
create policy "DELETE" on plans for delete to authenticated
  using ((select has_claim('plans_admin')));

create policy "SELECT" on memberships for select to authenticated
  using ((select has_claim('admin')) or is_membership_user(id, (select auth.uid())));
create policy "INSERT" on memberships for insert to authenticated
  with check ((select has_claim('admin')));
create policy "UPDATE" on memberships for update to authenticated
  using ((select has_claim('admin')));

create policy "SELECT" on membership_users for select to authenticated
  using ((select auth.uid()) = user_id or (select has_claim('admin')));
create policy "INSERT" on membership_users for insert to authenticated
  with check ((select has_claim('admin')));
create policy "UPDATE" on membership_users for update to authenticated
  using ((select has_claim('admin')));
create policy "DELETE" on membership_users for delete to authenticated
  using ((select has_claim('admin')));

create policy "SELECT" on pause_days for select to authenticated
  using ((select has_claim('admin')) or is_membership_user(membership_id, (select auth.uid())));
create policy "INSERT" on pause_days for insert to authenticated
  with check ((select has_claim('admin')));
create policy "UPDATE" on pause_days for update to authenticated
  using ((select has_claim('admin')));
create policy "DELETE" on pause_days for delete to authenticated
  using ((select has_claim('admin')));

create policy "SELECT" on payments for select to authenticated
  using (
    (select has_claim('admin'))
    or (select auth.uid()) = paid_by
    or is_membership_user(membership_id, (select auth.uid()))
  );
create policy "INSERT" on payments for insert to authenticated
  with check ((select has_claim('admin')));
create policy "UPDATE" on payments for update to authenticated
  using ((select has_claim('admin')));

-- Column-level grant, so an anonymous visitor cannot set status or user_id.
grant insert (name, phone, email, source) on leads to anon;

create policy "INSERT anon" on leads for insert to anon
  with check (source = 'free_trial');

create policy "SELECT" on leads for select to authenticated
  using ((select has_claim('admin')));
create policy "INSERT" on leads for insert to authenticated
  with check ((select has_claim('admin')));
create policy "UPDATE" on leads for update to authenticated
  using ((select has_claim('admin')));

create index user_profiles_phone_idx     on user_profiles(phone);
create index membership_users_user_idx   on membership_users(user_id);
create index memberships_end_date_idx    on memberships(end_date);
create index payments_membership_idx     on payments(membership_id);
create index payments_paid_by_idx        on payments(paid_by);
create index payments_pending_idx        on payments(created_at) where status = 'pending';
create index payments_unreconciled_idx   on payments(created_at)
  where status = 'paid' and reconciled_at is null and method <> 'cash';

create or replace function create_membership(
  p_user_ids   uuid[],
  p_plan_id    uuid,
  p_discount   numeric default 0,
  p_reason     text    default null,
  p_created_by uuid    default null
) returns memberships
language plpgsql security definer set search_path = public
as $$
declare
  v_plan  plans%rowtype;
  v_start date;
  v_row   memberships%rowtype;
  v_uid   uuid;
begin
  if not has_claim('admin') then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;

  select * into v_plan from plans where id = p_plan_id;
  if v_plan.id is null then
    raise exception 'no such plan' using errcode = 'no_data_found';
  end if;

  if coalesce(array_length(p_user_ids, 1), 0) = 0
     or array_length(p_user_ids, 1) > v_plan.max_seats then
    raise exception 'this plan allows % seat(s)', v_plan.max_seats
      using errcode = 'check_violation';
  end if;

  select greatest(
           today_ist(),
           coalesce(max(m.end_date + coalesce(pd.days_used, 0)) + 1, today_ist())
         )
    into v_start
  from membership_users mu
  join memberships m on m.id = mu.membership_id
  left join lateral (
    select sum(paused_to - paused_from + 1)::int as days_used
    from pause_days
    where membership_id = m.id
  ) pd on true
  where mu.user_id = any(p_user_ids)
    and mu.status = 'active';

  insert into memberships
    (plan_id, start_date, end_date, discount_amount, discount_reason, created_by)
  values
    (p_plan_id, v_start, v_start + v_plan.duration_days - 1,
     p_discount, p_reason, coalesce(p_created_by, auth.uid()))
  returning * into v_row;

  foreach v_uid in array p_user_ids loop
    insert into membership_users (membership_id, user_id) values (v_row.id, v_uid);
  end loop;

  return v_row;
end;
$$;

revoke execute on function create_membership(uuid[], uuid, numeric, text, uuid) from public;
grant  execute on function create_membership(uuid[], uuid, numeric, text, uuid) to authenticated;

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;
grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- Leads are marked 'lost', never removed. No delete policy either.
revoke delete on leads from authenticated;
