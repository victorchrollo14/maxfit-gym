-- The dashboard's numbers, now read from membership_summary. Adds starting
-- today, expiring this week, collected today by method, and total pending.
-- The return type changes, so the function is dropped and created again.
drop function admin_dashboard_stats();

create function admin_dashboard_stats()
returns table (
  total_members      bigint,
  active_members     bigint,
  paused_today       bigint,
  starting_today     bigint,
  expiring_this_week bigint,
  collected_today_upi  numeric,
  collected_today_cash numeric,
  collected_today_card numeric,
  total_pending      numeric,
  leads_today        bigint,
  open_leads         bigint
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
  with seats as (
    select unnest(s.member_ids) as user_id, s.*
      from membership_summary s
     where s.status <> 'cancelled'
  ),
  collected as (
    select method, sum(amount) as total
      from payments
     where status = 'paid'
       and (paid_at at time zone 'Asia/Kolkata')::date = v_today
     group by method
  )
  select
    (select count(distinct user_id) from seats),
    (select count(distinct user_id) from seats where status in ('active', 'paused')),
    (select count(distinct user_id) from seats where status = 'paused'),
    (select count(distinct user_id) from seats where start_date = v_today),
    -- Members whose current membership ends this week with nothing queued after it.
    (select count(distinct s.user_id)
       from seats s
      where s.expiring_soon
        and not exists (
          select 1 from seats nxt
           where nxt.user_id = s.user_id and nxt.status = 'upcoming'
        )),
    coalesce((select total from collected where method = 'upi'), 0),
    coalesce((select total from collected where method = 'cash'), 0),
    coalesce((select total from collected where method = 'card'), 0),
    (select coalesce(sum(amount_pending), 0)
       from membership_summary
      where status <> 'cancelled' and amount_pending > 0),
    (select count(*) from leads
      where (created_at at time zone 'Asia/Kolkata')::date = v_today),
    (select count(*) from leads
      where status in ('new', 'hot', 'warm', 'cold'));
end;
$$;

revoke execute on function admin_dashboard_stats() from public;
grant  execute on function admin_dashboard_stats() to authenticated;
