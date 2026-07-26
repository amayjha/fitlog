-- Fix: the profiles SELECT policy only allowed reading rows if you were
-- already a paid member — which meant an unpaid (or newly signed-up) user
-- couldn't even read their own profile row. Everyone should be able to read
-- their own profile; paid members can additionally read everyone's (needed
-- to show usernames on shared posts/comments).

drop policy if exists "Paid members can view profiles" on profiles;
create policy "Users can view their own profile, paid members can view all"
  on profiles for select
  using (id = auth.uid() or is_paid_member());
