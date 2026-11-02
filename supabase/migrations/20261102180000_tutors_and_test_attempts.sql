-- Tutors are saved configs, not trained models.
-- Open test answer keys stay in the server session store, not in a client-readable column.
-- test_attempts is written after scoring, so explanations are available only then.

create table public.tutors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  course text not null check (char_length(course) between 1 and 120),
  focus text not null default '',
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  explanation_style text not null check (explanation_style in ('step_by_step', 'example_first', 'concise')),
  goals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutors_goals_array check (jsonb_typeof(goals) = 'array')
);

create index tutors_user_updated_idx
  on public.tutors (user_id, updated_at desc);

create table public.test_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null,
  kind text not null check (kind in ('test', 'practice')),
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  topic_breakdown jsonb not null default '[]'::jsonb,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index test_attempts_user_created_idx
  on public.test_attempts (user_id, created_at desc);

alter table public.tutors enable row level security;
alter table public.test_attempts enable row level security;

revoke all on public.tutors from anon, authenticated;
revoke all on public.test_attempts from anon, authenticated;

grant select, insert, update, delete on public.tutors to authenticated;
grant select, insert on public.test_attempts to authenticated;

create policy tutors_select_own
  on public.tutors
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy tutors_insert_own
  on public.tutors
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy tutors_update_own
  on public.tutors
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy tutors_delete_own
  on public.tutors
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy test_attempts_select_own
  on public.test_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy test_attempts_insert_own
  on public.test_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Cap is also enforced in the API. This trigger is the database backstop.
create or replace function private.enforce_tutor_cap()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.tutors where user_id = new.user_id) >= 8 then
    raise exception 'tutor cap of 8 reached';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_tutor_cap() from public, anon, authenticated;
grant execute on function private.enforce_tutor_cap() to authenticated;

create trigger tutors_cap
  before insert on public.tutors
  for each row
  execute function private.enforce_tutor_cap();
