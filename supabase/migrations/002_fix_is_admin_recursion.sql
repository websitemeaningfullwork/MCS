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

-- Superseded by migration 006 (P1 #5): public mentor reads go through the
-- column-safe public_mentor_profiles view, never the base `profiles` table
-- (which exposes email/phone). Intentionally NOT recreated here; the drop stays
-- so re-running 002 removes any legacy copy instead of re-opening the leak.
-- (The is_admin() recursion fix above is this migration's real purpose.)
drop policy if exists "profiles: public read mentors" on public.profiles;
