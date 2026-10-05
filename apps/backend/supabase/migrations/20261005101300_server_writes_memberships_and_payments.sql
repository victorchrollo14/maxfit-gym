-- Memberships, seats and pauses carry rules that read other rows (seat counts,
-- overlaps, pause allowance), so only server functions write them, with the
-- service-role key. Browsers keep read access through the select policies.
drop policy "INSERT" on memberships;
drop policy "UPDATE" on memberships;

drop policy "INSERT" on membership_users;
drop policy "UPDATE" on membership_users;
drop policy "DELETE" on membership_users;

drop policy "INSERT" on pause_days;
drop policy "UPDATE" on pause_days;
drop policy "DELETE" on pause_days;

revoke insert, update, delete on memberships, membership_users, pause_days
  from anon, authenticated;

-- Payments are recorded by the recordPayment server function, which checks the
-- amount against what's pending. The browser may only void a payment (or, later,
-- reconcile it): a column grant makes every other column read-only.
drop policy "INSERT" on payments;
revoke insert, update, delete on payments from anon, authenticated;
grant update (status, void_reason, reconciled_at) on payments to authenticated;
