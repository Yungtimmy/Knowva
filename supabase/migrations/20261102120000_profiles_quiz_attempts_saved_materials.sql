-- Knowva MVP: profiles, quiz attempts, saved materials.
-- Own rows only. Role is not read from user-editable metadata.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'teacher')),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id text not null,
  subject text not null,
  topic text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  missed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.saved_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('study_pack', 'lesson', 'quiz', 'marking_guide')),
  title text not null,
  subject text,
  topic text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index quiz_attempts_user_created_idx
  on public.quiz_attempts (user_id, created_at desc);

create index saved_materials_user_created_idx
  on public.saved_materials (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.saved_materials enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.quiz_attempts from anon, authenticated;
revoke all on public.saved_materials from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant select, insert, update, delete on public.saved_materials to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy quiz_attempts_select_own
  on public.quiz_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy quiz_attempts_insert_own
  on public.quiz_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy quiz_attempts_update_own
  on public.quiz_attempts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy quiz_attempts_delete_own
  on public.quiz_attempts
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy saved_materials_select_own
  on public.saved_materials
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy saved_materials_insert_own
  on public.saved_materials
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy saved_materials_update_own
  on public.saved_materials
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy saved_materials_delete_own
  on public.saved_materials
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- New accounts are students. A teacher role is applied later with the service role.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'student',
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Learner')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- Clients cannot change their own role. Service role and the SQL owner can.
create or replace function private.prevent_role_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
      return new;
    end if;
    if auth.jwt() is null and current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    raise exception 'role cannot be changed from the client';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_role_change() from public, anon, authenticated;
grant execute on function private.prevent_role_change() to authenticated;

create trigger profiles_lock_role
  before update on public.profiles
  for each row
  execute function private.prevent_role_change();

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
    grant execute on function private.handle_new_user() to supabase_auth_admin;
  end if;
end;
$$;
