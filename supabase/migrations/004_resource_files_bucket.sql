-- Migration 004 — private bucket for e-book / resource files.
-- Admins manage files; students download via server-signed URLs. Safe to re-run.

insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do nothing;

drop policy if exists "resource-files: admin all" on storage.objects;
create policy "resource-files: admin all" on storage.objects
  for all to authenticated
  using (bucket_id = 'resource-files' and public.is_admin())
  with check (bucket_id = 'resource-files' and public.is_admin());
