-- Backfill a profiles row for an existing auth.users account whose
-- handle_new_user trigger never fired (it predates the trigger being fixed).
-- Adjust the username if you'd like something other than the email prefix.

insert into profiles (id, username, is_paid)
select id, split_part(email, '@', 1), true
from auth.users
where email = 'ojshop.aj@gmail.com'
on conflict (id) do update set is_paid = true;
