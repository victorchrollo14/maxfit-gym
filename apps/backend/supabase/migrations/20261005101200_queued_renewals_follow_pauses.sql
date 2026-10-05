-- A renewal bought early is queued to start the day after the current
-- membership ends. When that end moves (a pause, an early resume, a deleted
-- pause), the queue moves with it.
--
-- Only the *next* membership of each seat holder moves. Moving its start_date
-- recalculates its own end_date, which fires this trigger again for the one
-- after it, so a chain A → B → C shifts once each. Moving every upcoming
-- membership here would move C twice: once for A, and again for B.
create or replace function shift_next_membership()
returns trigger language plpgsql as $$
begin
  update memberships
     set start_date = start_date + (new.end_date - old.end_date)
   where id in (
     select distinct on (mine.user_id) nxt.id
       from membership_users mine
       join membership_users theirs
         on theirs.user_id = mine.user_id and theirs.status = 'active'
       join memberships nxt on nxt.id = theirs.membership_id
      where mine.membership_id = new.id
        and mine.status = 'active'
        and nxt.id <> new.id
        and nxt.cancelled_at is null
        and nxt.start_date > old.end_date
        and nxt.start_date > today_ist()
      order by mine.user_id, nxt.start_date
   );
  return null;
end;
$$;

-- Not "after update of end_date": end_date is set by the before trigger, and a
-- column-list trigger only fires for columns named in the UPDATE itself.
create trigger memberships_shift_next
  after update on memberships
  for each row
  when (old.end_date is distinct from new.end_date)
  execute function shift_next_membership();
