-- Migration 002 — fix infinite RLS recursion on profiles.
--
-- is_admin() reads public.profiles, and the profiles SELECT policy calls
-- is_admin() → without SECURITY DEFINER this recurses ("stack depth limit
-- exceeded"). SECURITY DEFINER makes the helper bypass RLS on its internal
-- read, breaking the loop. This is the standard Supabase pattern.
-- Safe to re-run.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Ensure the public mentor-profile read policy exists (idempotent).
drop policy if exists "profiles: public read mentors" on public.profiles;
create policy "profiles: public read mentors" on public.profiles for select
  using (role = 'mentor');
