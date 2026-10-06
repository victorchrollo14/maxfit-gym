-- created_at is when a payment was typed in. paid_at is when the money changed
-- hands, which the admin can backdate: Saturday's UPI entered on Monday is
-- Saturday's payment.
alter table payments
  add column paid_at timestamptz not null default now(),
  add column note    text;
