-- Every manual entry is money already received, so there's no sensible default:
-- the caller says 'paid'. 'pending' and 'failed' stay for a future payment
-- gateway. 'refunded' goes: there are no refunds, and if they come back they
-- won't be a status on the original payment.
alter table payments alter column status drop default;

-- A wrong entry is voided with a reason and entered again, never edited or deleted.
alter table payments drop constraint payments_status_check;
alter table payments add constraint payments_status_check
  check (status in ('pending', 'paid', 'failed', 'void'));

alter table payments add column void_reason text;
alter table payments add constraint payments_void_has_reason
  check (status <> 'void' or nullif(btrim(void_reason), '') is not null);

-- Once paid, a payment can only be voided, and a void is final. The browser
-- may update status (to void a payment), so this is what stops it from quietly
-- turning a paid payment back into pending.
create or replace function payments_status_change()
returns trigger language plpgsql as $$
begin
  if old.status = new.status then
    return new;
  end if;
  if old.status = 'void' or (old.status = 'paid' and new.status <> 'void') then
    raise exception 'a % payment cannot become %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger payments_status_change
  before update of status on payments
  for each row execute function payments_status_change();
