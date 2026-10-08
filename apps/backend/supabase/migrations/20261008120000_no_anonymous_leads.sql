-- The free-trial form is gone, so leads come only from signed-in staff.
drop policy "INSERT anon" on leads;
revoke all on leads from anon;
