-- GoTrue stores auth.users.phone without the leading +, and the triggers copied
-- it as is, so user_profiles.phone ('919845012345') never matched leads.phone
-- ('+919845012345'). Copy it in E.164 instead. An empty phone is no phone.
create or replace function e164(_phone text)
returns text language sql immutable
as $$
  select case
    when nullif(btrim(_phone), '') is null then null
    when _phone like '+%' then _phone
    else '+' || _phone
  end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, name, phone, email, phone_verified_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    e164(new.phone),
    new.email,
    new.phone_confirmed_at
  );
  return new;
end;
$$;

create or replace function handle_user_updated()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.user_profiles
     set phone             = e164(new.phone),
         email             = new.email,
         phone_verified_at = new.phone_confirmed_at,
         updated_at        = now()
   where id = new.id;
  return new;
end;
$$;
