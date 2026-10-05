-- Receipt numbers look like MF-2026-00042: the year it was issued, in IST, and
-- one running counter that never resets.
create or replace function assign_invoice_number()
returns trigger language plpgsql as $$
declare
  v_n bigint;
begin
  if new.status = 'paid' and new.invoice_number is null then
    v_n := nextval('invoice_seq');
    new.invoice_number :=
      'MF-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-'
      || lpad(v_n::text, greatest(5, length(v_n::text)), '0');
  end if;
  return new;
end;
$$;

-- Fires on insert, and when a payment becomes paid later (a gateway webhook).
create trigger payments_invoice_number
  before insert or update of status on payments
  for each row execute function assign_invoice_number();
