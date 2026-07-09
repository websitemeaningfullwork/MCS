-- Migration 001 — allow the public to read mentor profiles (name, photo, bio).
-- Run this once in the Supabase SQL editor.
-- Safe to re-run.
drop policy if exists "profiles: public read mentors" on public.profiles;
create policy "profiles: public read mentors" on public.profiles for select
  using (role = 'mentor');
