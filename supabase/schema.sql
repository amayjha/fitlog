-- FitLog Community — Phase 1 schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).

create extension if not exists pgcrypto;

-- ── Profiles ──────────────────────────────────────────────────────────────
-- One row per auth.users row. `is_paid` is the entitlement flag that Phase 3
-- (RevenueCat webhook, using the service_role key which bypasses RLS) will
-- flip — it must never be settable by the user themselves.
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  avatar_url text,
  is_paid    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Auto-create a profile row whenever a new user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Prevent clients from ever setting their own is_paid via a normal UPDATE —
-- only a service_role connection (bypasses RLS entirely) can change it.
-- Only block the client's own authenticated session from changing its own
-- is_paid — dashboard/SQL Editor connections and future service_role webhook
-- calls (Phase 3 billing) have no 'authenticated' JWT role and pass through.
create or replace function protect_is_paid()
returns trigger as $$
begin
  if auth.role() = 'authenticated' then
    new.is_paid := old.is_paid;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists protect_profiles_is_paid on profiles;
create trigger protect_profiles_is_paid
  before update on profiles
  for each row execute procedure protect_is_paid();

-- security definer so this bypasses RLS internally — a plain subquery on
-- profiles inside a policy defined ON profiles causes infinite recursion.
create or replace function is_paid_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_paid from profiles where id = auth.uid()), false);
$$;

-- Everyone can read their own profile row; paid members can also read
-- everyone's (needed to show usernames on shared posts/comments).
create policy "Users can view their own profile, paid members can view all"
  on profiles for select
  using (id = auth.uid() or is_paid_member());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- ── Shared content ────────────────────────────────────────────────────────
-- Exercises/meals are stored by name, not local exercise IDs — those IDs are
-- generated per-device and mean nothing on another user's phone.

create table if not exists shared_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  exercises   jsonb not null, -- [{ name, group }]
  created_at  timestamptz not null default now()
);

create table if not exists shared_food_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  meals       jsonb not null, -- { Breakfast: [...], Lunch: [...], ... }
  created_at  timestamptz not null default now()
);

create table if not exists shared_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  goal_type   text not null,
  target      jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  item_type  text not null check (item_type in ('template', 'food_plan', 'goal')),
  item_id    uuid not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_item_idx on comments (item_type, item_id);

alter table shared_templates  enable row level security;
alter table shared_food_plans enable row level security;
alter table shared_goals      enable row level security;
alter table comments          enable row level security;

-- Same read/write shape for all three shared-content tables and comments:
-- only paid members can see or post community content, and you can only
-- create/edit/delete rows as yourself.
do $$
declare
  t text;
begin
  foreach t in array array['shared_templates', 'shared_food_plans', 'shared_goals', 'comments']
  loop
    execute format('
      create policy "Paid members can view %1$s"
        on %1$s for select
        using (is_paid_member());', t);

    execute format('
      create policy "Paid members can create %1$s"
        on %1$s for insert
        with check (user_id = auth.uid() and is_paid_member());', t);

    execute format('
      create policy "Owners can update their %1$s"
        on %1$s for update
        using (user_id = auth.uid());', t);

    execute format('
      create policy "Owners can delete their %1$s"
        on %1$s for delete
        using (user_id = auth.uid());', t);
  end loop;
end $$;

-- ── Reactions ─────────────────────────────────────────────────────────────
-- A user can react once per emoji per item (toggled on/off from the app).

create table if not exists reactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  item_type  text not null check (item_type in ('template', 'food_plan', 'goal')),
  item_id    uuid not null,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id, emoji)
);
create index if not exists reactions_item_idx on reactions (item_type, item_id);

alter table reactions enable row level security;

create policy "Paid members can view reactions"
  on reactions for select
  using (is_paid_member());

create policy "Paid members can add reactions"
  on reactions for insert
  with check (user_id = auth.uid() and is_paid_member());

create policy "Owners can remove their reactions"
  on reactions for delete
  using (user_id = auth.uid());
