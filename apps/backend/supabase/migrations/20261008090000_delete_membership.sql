-- Removes a membership entered by mistake, with its seats, pauses and payments.
-- Only the server calls it, after checking the membership_delete claim.
create or replace function delete_membership(_membership_id uuid)
returns boolean
language plpgsql set search_path = public
as $$
begin
  delete from pause_days       where membership_id = _membership_id;
  delete from payments         where membership_id = _membership_id;
  delete from membership_users where membership_id = _membership_id;
  delete from memberships      where id = _membership_id;
  return found;
end;
$$;

revoke execute on function delete_membership(uuid) from public, anon, authenticated;
grant  execute on function delete_membership(uuid) to service_role;
