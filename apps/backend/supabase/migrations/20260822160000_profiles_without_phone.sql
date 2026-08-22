-- user_profiles.phone was not null when the table only held members, who are
-- phone-first. Staff are email-first, and they need a row here too — leads.admin_id,
-- memberships.created_by, payments.marked_by and pause_days.requested_by all point
-- at it.

alter table user_profiles alter column phone drop not null;

alter table user_profiles add constraint user_profiles_contactable
  check (phone is not null or email is not null);
