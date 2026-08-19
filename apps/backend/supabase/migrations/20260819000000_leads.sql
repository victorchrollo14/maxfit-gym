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

alter table leads enable row level security;

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

grant select, insert, update on leads to authenticated;
grant select, insert, update, delete on leads to service_role;
