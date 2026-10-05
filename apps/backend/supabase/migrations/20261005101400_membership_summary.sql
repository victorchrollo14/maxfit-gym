-- One row per membership with everything the CRM shows about it. Status, money
-- and pause balance are computed here and never stored. security_invoker, so
-- the caller's RLS applies: admins see every row, members their own.
create view membership_summary
with (security_invoker = true)
as
with paid as (
  select membership_id,
         sum(amount) filter (where status = 'paid') as amount_paid
    from payments
   where membership_id is not null
   group by membership_id
),
paused as (
  select membership_id,
         sum(paused_to - paused_from + 1)::int as days_used,
         bool_or(today_ist() between paused_from and paused_to) as paused_today
    from pause_days
   group by membership_id
),
seats as (
  select membership_id,
         array_agg(user_id order by created_at) as member_ids
    from membership_users
   where status = 'active'
   group by membership_id
),
base as (
  select m.*,
         case
           when m.cancelled_at is not null                  then 'cancelled'
           when today_ist() < m.start_date                  then 'upcoming'
           when today_ist() > m.end_date                    then 'expired'
           when coalesce(pd.paused_today, false)            then 'paused'
           else 'active'
         end as status,
         coalesce(pd.days_used, 0)                          as pause_days_used,
         coalesce(p.amount_paid, 0)                         as amount_paid,
         s.member_ids
    from memberships m
    left join paid   p  on p.membership_id  = m.id
    left join paused pd on pd.membership_id = m.id
    left join seats  s  on s.membership_id  = m.id
)
select
  id as membership_id,
  member_ids,
  plan_key,
  plan_name,
  status,
  -- Ends within the next 7 days, today included.
  status in ('active', 'paused')
    and end_date - today_ist() + 1 <= 7                    as expiring_soon,
  start_date,
  end_date,
  -- Days of membership still to come, today included.
  greatest(end_date - greatest(today_ist(), start_date) + 1, 0) as days_left,
  price,
  discount_amount,
  discount_reason,
  price - discount_amount                                  as amount_due,
  amount_paid,
  price - discount_amount - amount_paid                    as amount_pending,
  pause_days_allowed,
  pause_days_used,
  pause_days_allowed - pause_days_used                     as pause_days_left,
  cancelled_at,
  cancel_reason,
  created_at
from base;

revoke all on membership_summary from anon;
grant select on membership_summary to authenticated;
