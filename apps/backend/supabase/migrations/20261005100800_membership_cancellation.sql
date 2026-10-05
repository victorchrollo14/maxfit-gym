-- Cancelling ends a membership early. The money stays: there are no refunds.
alter table memberships
  add column cancelled_at  timestamptz,
  add column cancelled_by  uuid references user_profiles(id) on delete set null,
  add column cancel_reason text,
  add constraint memberships_cancel_has_reason
    check (cancelled_at is null or nullif(btrim(cancel_reason), '') is not null);
