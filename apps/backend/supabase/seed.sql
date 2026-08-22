insert into plans (id, family, name, duration_days, price, max_seats, pause_days_allowed, is_active) values
 ('a0000000-0000-0000-0000-000000000001','early_bird','Early Bird Pass', 365,  8000, 1, 15, true),
 ('a0000000-0000-0000-0000-000000000002','monthly',   'Monthly Pass',     30,  2000, 1,  0, true),
 ('a0000000-0000-0000-0000-000000000003','quarterly', '3 Month Pass',     90,  4000, 1,  0, true),
 ('a0000000-0000-0000-0000-000000000004','halfyearly','6 Month Pass',    180,  6000, 1,  7, true),
 ('a0000000-0000-0000-0000-000000000005','annual',    'Annual Pass',     365, 10000, 1, 15, true),
 ('a0000000-0000-0000-0000-000000000006','couple',    'Couple Pass',     365, 16000, 2, 15, true);

-- The token columns are '' rather than null because GoTrue reads them as
-- strings and errors on null during an email OTP.
insert into auth.users
 (id, instance_id, aud, role, phone, phone_confirmed_at, email, email_confirmed_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  '+919000000001', now(), 'victor20030214@gmail.com', now(),
  '', '', '', '',
  '{"admin":true,"plans_admin":true,"claims_admin":true}', '{"name":"Michael D''Souza"}', now(), now());

insert into memberships (id, plan_id, start_date, end_date, created_by) values
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
  today_ist() - 30, today_ist() + 334, 'd0000000-0000-0000-0000-000000000001');

insert into membership_users (membership_id, user_id, status) values
 ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','active');

insert into pause_days (membership_id, paused_from, paused_to, requested_on, requested_by) values
 ('b0000000-0000-0000-0000-000000000001', today_ist() - 10, today_ist() - 8,
  today_ist() - 11, 'd0000000-0000-0000-0000-000000000001');

insert into payments
 (membership_id, paid_by, amount, method, reference_id, status,
  reconciled_at, marked_by, invoice_number) values
 ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
  8000,'upi','452312909981','paid', now(),
  'd0000000-0000-0000-0000-000000000001','INV-2026-00001');

insert into leads (name, phone, source, status) values
 ('Nikhil Bhat', '+919000001001', 'free_trial', 'new');
