-- Run this in Supabase → SQL Editor
-- Make sure you've already created the "user-files" bucket (private) in Storage

-- Enable RLS on storage.objects (usually already enabled)
alter table storage.objects enable row level security;

-- Allow authenticated users to upload files ONLY to their own folder (/{user_id}/...)
create policy "Users upload own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
create policy "Users read own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
create policy "Users delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
create policy "Users update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
