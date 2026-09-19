drop function create_membership(uuid[], uuid, numeric, text, uuid);
drop function request_pause(uuid, date);
drop function resume_pause(uuid);
drop trigger pause_days_allowance on pause_days;
drop function check_pause_allowance();
