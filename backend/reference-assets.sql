-- Nur einmal im Supabase SQL Editor ausführen, wenn das restliche ERSTELLI-Schema bereits existiert.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public=true,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;
