-- end_date is the day a membership really ends, pauses included. It's derived,
-- never written by hand: every insert or update of a membership recalculates
-- it, and every change to its pauses touches the membership so that happens.
create or replace function membership_days_paused(_membership_id uuid)
returns int language sql stable
as $$
  -- An early resume shortens paused_to, so the unused days drop out of the sum.
  select coalesce(sum(paused_to - paused_from + 1), 0)::int
    from pause_days
   where membership_id = _membership_id;
$$;

create or replace function set_membership_end_date()
returns trigger language plpgsql as $$
begin
  new.end_date := new.start_date + new.duration_days - 1
                  + membership_days_paused(new.id);
  return new;
end;
$$;

create trigger memberships_end_date
  before insert or update on memberships
  for each row execute function set_membership_end_date();

create or replace function touch_paused_membership()
returns trigger language plpgsql as $$
begin
  -- A no-op update: the memberships trigger does the recalculating.
  if tg_op in ('UPDATE', 'DELETE') then
    update memberships set end_date = end_date where id = old.membership_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.membership_id is distinct from old.membership_id then
    update memberships set end_date = end_date where id = new.membership_id;
  end if;
  return null;
end;
$$;

create trigger pause_days_touch_membership
  after insert or update or delete on pause_days
  for each row execute function touch_paused_membership();
