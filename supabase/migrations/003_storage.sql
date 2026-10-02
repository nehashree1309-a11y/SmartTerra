insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('field-photos', 'field-photos', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated users may upload only into a folder named for their own user ID.
create policy smartterra_storage_upload_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id in ('documents', 'field-photos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Users may read their own files; officers and admins may read all SmartTerra files.
create policy smartterra_storage_read_authorized
on storage.objects for select to authenticated
using (
  bucket_id in ('documents', 'field-photos')
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.has_role((select auth.uid()), 'officer'::public.app_role)
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
  )
);

-- Authenticated users may replace only files inside their own user-ID folder.
create policy smartterra_storage_update_own_folder
on storage.objects for update to authenticated
using (
  bucket_id in ('documents', 'field-photos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('documents', 'field-photos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
