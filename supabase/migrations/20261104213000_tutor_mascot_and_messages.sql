-- Additive tutor chat history and per-tutor mascot colour.
-- Safe to re-run. Does not change Auth Site URL, redirect URLs, or secrets.

alter table public.tutors add column if not exists mascot_color text;
alter table public.tutors add column if not exists last_chat_at timestamptz;

update public.tutors
set mascot_color = case
  when course ~* '\m(maths?|mathematics|algebra|calculus|arithmetic)\M' then '#2412B0'
  when course ~* '\mbiolog' then '#FF4A1C'
  when course ~* '\m(physics|phys)\M' then '#FBE062'
  when course ~* '\m(english|literature|comprehension)\M' then '#2F6B4F'
  else (array['#2412B0', '#FF4A1C', '#FBE062', '#2F6B4F'])[1 + (hashtext(id::text) & 3)]
end
where mascot_color is null or mascot_color !~ '^#[0-9A-Fa-f]{6}$';

alter table public.tutors alter column mascot_color set default '#2412B0';
alter table public.tutors alter column mascot_color set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tutors_mascot_color_hex') then
    alter table public.tutors
      add constraint tutors_mascot_color_hex
      check (mascot_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end
$$;

create table if not exists public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  role text not null check (role in ('user', 'tutor')),
  body text not null default '',
  short text not null default '',
  steps jsonb not null default '[]'::jsonb,
  remember text not null default '',
  next text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint tutor_messages_steps_array check (jsonb_typeof(steps) = 'array'),
  constraint tutor_messages_attachments_array check (jsonb_typeof(attachments) = 'array')
);

create index if not exists tutor_messages_thread_idx
  on public.tutor_messages (user_id, tutor_id, created_at);

alter table public.tutor_messages enable row level security;

revoke all on public.tutor_messages from anon, authenticated;
grant select, insert on public.tutor_messages to authenticated;

drop policy if exists tutor_messages_select_own on public.tutor_messages;
create policy tutor_messages_select_own
  on public.tutor_messages
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists tutor_messages_insert_own on public.tutor_messages;
create policy tutor_messages_insert_own
  on public.tutor_messages
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tutors
      where tutors.id = tutor_id and tutors.user_id = auth.uid()
    )
  );
