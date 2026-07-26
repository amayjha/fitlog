-- Fix: protect_is_paid() reverted is_paid on every UPDATE unconditionally —
-- which also blocked the Supabase Table Editor (and would have blocked a
-- future service-role webhook) from ever setting it, since triggers fire
-- regardless of RLS or which role issued the query.
--
-- auth.role() reads the request's JWT role claim: 'authenticated' means an
-- end-user's own logged-in client session made the request — that's the
-- only case we actually need to block. Dashboard/SQL Editor connections and
-- service_role requests (Phase 3's billing webhook) have no such claim (or
-- report 'service_role') and should be allowed through.

create or replace function protect_is_paid()
returns trigger as $$
begin
  if auth.role() = 'authenticated' then
    new.is_paid := old.is_paid;
  end if;
  return new;
end;
$$ language plpgsql;
