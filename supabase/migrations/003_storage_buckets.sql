-- Migration 003 — storage buckets + policies.
-- payment-screenshots: PRIVATE (owner + admin read; owner writes own folder).
-- avatars: PUBLIC read; owner writes own folder.
-- Safe to re-run.

insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ---- payment-screenshots policies ----
drop policy if exists "payment-screenshots: upload own" on storage.objects;
create policy "payment-screenshots: upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment-screenshots: read own or admin" on storage.objects;
create policy "payment-screenshots: read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-screenshots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---- avatars policies ----
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: upload own" on storage.objects;
create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: update own" on storage.objects;
create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
