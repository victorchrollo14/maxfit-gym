-- end_date is the day a membership really ends, pauses included:
-- start_date + duration_days - 1 + days paused. It's derived, never written by
-- hand. The memberships trigger covers a new membership or a changed start or
-- duration; the pause_days trigger covers a pause being added, changed or removed.
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
  before insert or update of start_date, duration_days on memberships
  for each row execute function set_membership_end_date();

create or replace function set_paused_membership_end_date()
returns trigger language plpgsql as $$
declare
  v_id uuid := coalesce(new.membership_id, old.membership_id);
begin
  update memberships
     set end_date = start_date + duration_days - 1 + membership_days_paused(id)
   where id = v_id;
  return null;
end;
$$;

create trigger pause_days_end_date
  after insert or update or delete on pause_days
  for each row execute function set_paused_membership_end_date();
