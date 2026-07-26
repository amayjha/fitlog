-- Fix: the original policies checked `is_paid` via a subquery on `profiles`
-- directly inside a policy defined ON `profiles` — Postgres re-evaluates that
-- table's own RLS policy for the subquery, causing infinite recursion.
-- A security definer function bypasses RLS for this one check and breaks the loop.

create or replace function is_paid_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_paid from profiles where id = auth.uid()), false);
$$;

drop policy if exists "Paid members can view profiles" on profiles;
create policy "Paid members can view profiles"
  on profiles for select
  using (is_paid_member());

do $$
declare
  t text;
begin
  foreach t in array array['shared_templates', 'shared_food_plans', 'shared_goals', 'comments']
  loop
    execute format('drop policy if exists "Paid members can view %1$s" on %1$s;', t);
    execute format('
      create policy "Paid members can view %1$s"
        on %1$s for select
        using (is_paid_member());', t);

    execute format('drop policy if exists "Paid members can create %1$s" on %1$s;', t);
    execute format('
      create policy "Paid members can create %1$s"
        on %1$s for insert
        with check (user_id = auth.uid() and is_paid_member());', t);
  end loop;
end $$;
