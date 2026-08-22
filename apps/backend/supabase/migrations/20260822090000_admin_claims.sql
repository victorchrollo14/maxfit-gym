create or replace function is_claims_admin()
returns boolean language sql stable
as $$
  select has_claim('claims_admin');
$$;

create or replace function set_claim(uid uuid, claim text, value jsonb)
returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not is_claims_admin() then
    return 'error: access denied';
  end if;

  -- Auth owns these two; overwriting them locks the account out.
  if claim in ('provider', 'providers') then
    return 'error: reserved claim';
  end if;

  update auth.users
     set raw_app_meta_data =
           coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(claim, value)
   where id = uid;

  if not found then
    return 'error: no such user';
  end if;

  return 'OK';
end;
$$;

create or replace function delete_claim(uid uuid, claim text)
returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not is_claims_admin() then
    return 'error: access denied';
  end if;

  if claim in ('provider', 'providers') then
    return 'error: reserved claim';
  end if;

  if uid = auth.uid() and claim = 'claims_admin' then
    return 'error: cannot remove your own claims_admin';
  end if;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - claim
   where id = uid;

  if not found then
    return 'error: no such user';
  end if;

  return 'OK';
end;
$$;

-- Staff sign in by email, members by phone, so an email-only account is staff
-- even before it has a claim. Anyone already holding one is listed whatever
-- they signed up with.
create or replace function get_internal_users()
returns table (
  id              uuid,
  email           text,
  name            text,
  created_at      timestamptz,
  last_sign_in_at timestamptz,
  app_metadata    jsonb,
  banned_until    timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not is_claims_admin() then
    raise exception 'access denied' using errcode = 'insufficient_privilege';
  end if;

  return query
  select u.id,
         u.email::text,
         coalesce(p.name, '')::text,
         u.created_at,
         u.last_sign_in_at,
         coalesce(u.raw_app_meta_data, '{}'::jsonb),
         u.banned_until
    from auth.users u
    left join user_profiles p on p.id = u.id
   where (u.email is not null and u.phone is null)
      -- Claims are the boolean-true keys; `provider` and `providers` are a
      -- string and an array, so they don't match.
      or exists (
        select 1
          from jsonb_each(coalesce(u.raw_app_meta_data, '{}'::jsonb)) kv
         where kv.value = 'true'::jsonb
      )
   order by u.created_at desc;
end;
$$;

create or replace function set_internal_user_banned(uid uuid, banned boolean)
returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not is_claims_admin() then
    return 'error: access denied';
  end if;

  if uid = auth.uid() then
    return 'error: cannot disable yourself';
  end if;

  update auth.users
     set banned_until = case when banned then now() + interval '100 years' end
   where id = uid;

  if not found then
    return 'error: no such user';
  end if;

  return 'OK';
end;
$$;

create or replace function admin_dashboard_stats()
returns table (
  total_members   bigint,
  active_members  bigint,
  paused_today    bigint,
  leads_today     bigint,
  open_leads      bigint
)
language plpgsql security definer set search_path = public
as $$
declare
  v_today date := today_ist();
begin
  if not has_claim('admin') then
    raise exception 'access denied' using errcode = 'insufficient_privilege';
  end if;

  return query
  -- A pause pushes expiry out, so the stored end_date is short for anyone who
  -- has ever paused.
  with spans as (
    select mu.user_id,
           m.id as membership_id,
           m.start_date,
           m.end_date + coalesce((
             select sum(pd.paused_to - pd.paused_from + 1)::int
               from pause_days pd
              where pd.membership_id = m.id
           ), 0) as effective_end
      from membership_users mu
      join memberships m on m.id = mu.membership_id
     where mu.status = 'active'
  )
  select
    (select count(distinct user_id) from spans),
    (select count(distinct user_id) from spans
      where v_today between start_date and effective_end),
    (select count(distinct s.user_id)
       from spans s
       join pause_days pd on pd.membership_id = s.membership_id
      where v_today between pd.paused_from and pd.paused_to),
    (select count(*) from leads
      where (created_at at time zone 'Asia/Kolkata')::date = v_today),
    (select count(*) from leads
      where status in ('new', 'hot', 'warm', 'cold'));
end;
$$;

revoke execute on function is_claims_admin()                       from public;
revoke execute on function set_claim(uuid, text, jsonb)            from public;
revoke execute on function delete_claim(uuid, text)                from public;
revoke execute on function get_internal_users()                    from public;
revoke execute on function set_internal_user_banned(uuid, boolean) from public;
revoke execute on function admin_dashboard_stats()                 from public;

grant execute on function is_claims_admin()                       to authenticated;
grant execute on function set_claim(uuid, text, jsonb)            to authenticated;
grant execute on function delete_claim(uuid, text)                to authenticated;
grant execute on function get_internal_users()                    to authenticated;
grant execute on function set_internal_user_banned(uuid, boolean) to authenticated;
grant execute on function admin_dashboard_stats()                 to authenticated;

create index leads_created_at_idx on leads(created_at desc);
