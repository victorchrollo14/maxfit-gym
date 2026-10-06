-- A membership keeps the terms it was sold on. The plan list is read once, at
-- sale, and copied here; after that nothing reads it to answer a question
-- about this membership. Price differences are a discount with a reason, never
-- an edited price.
alter table memberships
  add column plan_key           text          not null,
  add column plan_name          text          not null,
  add column price              numeric(10,2) not null check (price >= 0),
  add column duration_days      int           not null check (duration_days > 0),
  add column pause_days_allowed int           not null check (pause_days_allowed >= 0),
  add constraint memberships_discount_within_price check (discount_amount <= price),
  add constraint memberships_discount_has_reason
    check (discount_amount = 0 or nullif(btrim(discount_reason), '') is not null);
