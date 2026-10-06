-- Memberships, seats, pauses and payments are written only by server functions,
-- with the service-role key. Browsers keep read access through the select policies.
drop policy "INSERT" on memberships;
drop policy "UPDATE" on memberships;

drop policy "INSERT" on membership_users;
drop policy "UPDATE" on membership_users;
drop policy "DELETE" on membership_users;

drop policy "INSERT" on pause_days;
drop policy "UPDATE" on pause_days;
drop policy "DELETE" on pause_days;

drop policy "INSERT" on payments;
drop policy "UPDATE" on payments;

revoke insert, update, delete on memberships, membership_users, pause_days, payments
  from anon, authenticated;
