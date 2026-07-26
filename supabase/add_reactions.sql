-- Reactions on community posts — same paid-gated shape as comments, but a
-- user can only react once per emoji per item (toggle on/off from the app).

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
