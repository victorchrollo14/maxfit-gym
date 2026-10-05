-- Codes the server sends on WhatsApp to verify a member's phone while the admin
-- adds them. Supabase's own phone OTP can't be used for this: verifying it signs
-- the browser in as the member, replacing the admin's session.
--
-- Only the server touches this table, with the service-role key.
create table phone_verifications (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     int  not null default 0 check (attempts >= 0),
  verified_at  timestamptz,
  used_at      timestamptz,
  requested_by uuid references user_profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Rate limits count recent codes per number.
create index phone_verifications_phone_idx
  on phone_verifications(phone, created_at desc);

-- RLS on with no policies, and no table privileges either: Supabase's default
-- privileges grant new tables to anon and authenticated.
alter table phone_verifications enable row level security;
revoke all on phone_verifications from anon, authenticated;
