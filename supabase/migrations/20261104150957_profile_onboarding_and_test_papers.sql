-- Profile onboarding (name, username, age, interests) and open test papers.
-- Answer keys are not stored in plaintext. The API keeps them in answer_seal
-- (AES-GCM ciphertext). Authenticated users can read the ciphertext only.

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists age smallint;
alter table public.profiles add column if not exists interests jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_username_format') then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9_.]{3,20}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_age_range') then
    alter table public.profiles
      add constraint profiles_age_range
      check (age is null or (age >= 10 and age <= 99));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_interests_array') then
    alter table public.profiles
      add constraint profiles_interests_array
      check (jsonb_typeof(interests) = 'array');
  end if;
end;
$$;

create unique index if not exists profiles_username_key on public.profiles (username);

grant insert (id, display_name, username, age, interests) on public.profiles to authenticated;

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- New Google accounts should keep the name Google sent, not the Learner placeholder.
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
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Learner'
    )
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
    grant execute on function private.handle_new_user() to supabase_auth_admin;
  end if;
end;
$$;

update public.profiles as profile
set display_name = coalesce(
  nullif(account.raw_user_meta_data ->> 'full_name', ''),
  nullif(account.raw_user_meta_data ->> 'name', ''),
  nullif(split_part(coalesce(account.email, ''), '@', 1), ''),
  profile.display_name
)
from auth.users as account
where account.id = profile.id
  and (profile.display_name is null or profile.display_name = 'Learner');

create table if not exists public.test_papers (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null check (char_length(course) between 1 and 120),
  tutor_id uuid references public.tutors (id) on delete set null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  topics jsonb not null default '[]'::jsonb,
  kind text not null check (kind in ('test', 'practice')),
  status text not null check (status in ('open', 'submitted')),
  questions jsonb not null,
  answer_seal text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint test_papers_topics_array check (jsonb_typeof(topics) = 'array'),
  constraint test_papers_questions_array check (jsonb_typeof(questions) = 'array')
);

create index if not exists test_papers_user_created_idx
  on public.test_papers (user_id, created_at desc);

alter table public.test_papers enable row level security;

revoke all on public.test_papers from anon, authenticated;
grant select, insert on public.test_papers to authenticated;
grant update (status, result, submitted_at) on public.test_papers to authenticated;

drop policy if exists test_papers_select_own on public.test_papers;
create policy test_papers_select_own
  on public.test_papers
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists test_papers_insert_own on public.test_papers;
create policy test_papers_insert_own
  on public.test_papers
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists test_papers_update_own on public.test_papers;
create policy test_papers_update_own
  on public.test_papers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
