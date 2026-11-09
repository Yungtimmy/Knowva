-- Private chat uploads for tutor PDFs and images.
-- Apply in the Supabase SQL editor. The app does not run this file.
-- Safe to re-run. Does not change Auth Site URL, redirect URLs, or secrets.
--
-- Object path: {user_id}/{tutor_id}/{uuid}-{filename}
-- storage.foldername leaves off the file, so a valid object has exactly two folders.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-uploads',
  'chat-uploads',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upsert needs select + insert + update. Delete lets the composer remove a chip before send.

drop policy if exists chat_uploads_select_own on storage.objects;
create policy chat_uploads_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'chat-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and name !~ '\.\.'
    and exists (
      select 1
      from public.tutors
      where tutors.id::text = (storage.foldername(name))[2]
        and tutors.user_id = (select auth.uid())
    )
  );

drop policy if exists chat_uploads_insert_own on storage.objects;
create policy chat_uploads_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'chat-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and name !~ '\.\.'
    and exists (
      select 1
      from public.tutors
      where tutors.id::text = (storage.foldername(name))[2]
        and tutors.user_id = (select auth.uid())
    )
  );

drop policy if exists chat_uploads_update_own on storage.objects;
create policy chat_uploads_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'chat-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and name !~ '\.\.'
    and exists (
      select 1
      from public.tutors
      where tutors.id::text = (storage.foldername(name))[2]
        and tutors.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'chat-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and name !~ '\.\.'
    and exists (
      select 1
      from public.tutors
      where tutors.id::text = (storage.foldername(name))[2]
        and tutors.user_id = (select auth.uid())
    )
  );

drop policy if exists chat_uploads_delete_own on storage.objects;
create policy chat_uploads_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'chat-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and name !~ '\.\.'
    and exists (
      select 1
      from public.tutors
      where tutors.id::text = (storage.foldername(name))[2]
        and tutors.user_id = (select auth.uid())
    )
  );

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  message_id uuid not null references public.tutor_messages (id) on delete cascade,
  kind text not null check (kind in ('pdf', 'image')),
  filename text not null check (char_length(filename) between 1 and 180),
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  storage_path text not null,
  page_count integer,
  extracted_text text,
  created_at timestamptz not null default now(),
  constraint message_attachments_kind_mime check (
    (kind = 'pdf' and mime_type = 'application/pdf')
    or (kind = 'image' and mime_type in ('image/png', 'image/jpeg', 'image/webp'))
  ),
  constraint message_attachments_pages check (page_count is null or page_count >= 0),
  constraint message_attachments_text_cap check (extracted_text is null or char_length(extracted_text) <= 16000),
  constraint message_attachments_own_path check (
    storage_path = user_id::text || '/' || tutor_id::text || '/' || split_part(storage_path, '/', 3)
    and split_part(storage_path, '/', 3) <> ''
    and split_part(storage_path, '/', 4) = ''
    and storage_path !~ '\.\.'
    and char_length(storage_path) <= 400
  )
);

create unique index if not exists message_attachments_path_idx
  on public.message_attachments (storage_path);

create index if not exists message_attachments_message_idx
  on public.message_attachments (message_id);

create index if not exists message_attachments_owner_idx
  on public.message_attachments (user_id, tutor_id, created_at);

alter table public.message_attachments enable row level security;

revoke all on public.message_attachments from anon, authenticated;
grant select, insert on public.message_attachments to authenticated;

drop policy if exists message_attachments_select_own on public.message_attachments;
create policy message_attachments_select_own
  on public.message_attachments
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists message_attachments_insert_own on public.message_attachments;
create policy message_attachments_insert_own
  on public.message_attachments
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.tutors
      where tutors.id = tutor_id
        and tutors.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.tutor_messages
      where tutor_messages.id = message_id
        and tutor_messages.user_id = (select auth.uid())
        and tutor_messages.tutor_id = message_attachments.tutor_id
        and tutor_messages.role = 'user'
    )
  );
