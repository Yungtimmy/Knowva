-- Inside EXISTS(select from tutors), unqualified `name` resolved to tutors.name, so the tutor check never matched.
drop policy if exists chat_uploads_select_own on storage.objects;
drop policy if exists chat_uploads_insert_own on storage.objects;
drop policy if exists chat_uploads_update_own on storage.objects;
drop policy if exists chat_uploads_delete_own on storage.objects;

create or replace function public.owns_chat_upload_path(object_name text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select (storage.foldername(object_name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(object_name), 1) = 2
    and object_name !~ '\.\.'
    and exists (
      select 1 from public.tutors t
      where t.id::text = (storage.foldername(object_name))[2]
        and t.user_id = (select auth.uid())
    );
$$;

create policy chat_uploads_select_own on storage.objects for select to authenticated
  using (bucket_id = 'chat-uploads' and public.owns_chat_upload_path(storage.objects.name));
create policy chat_uploads_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-uploads' and public.owns_chat_upload_path(storage.objects.name));
create policy chat_uploads_update_own on storage.objects for update to authenticated
  using (bucket_id = 'chat-uploads' and public.owns_chat_upload_path(storage.objects.name))
  with check (bucket_id = 'chat-uploads' and public.owns_chat_upload_path(storage.objects.name));
create policy chat_uploads_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'chat-uploads' and public.owns_chat_upload_path(storage.objects.name));
