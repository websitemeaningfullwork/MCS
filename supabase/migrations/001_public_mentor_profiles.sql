-- Migration 001 — allow the public to read mentor profiles (name, photo, bio).
-- Run this once in the Supabase SQL editor.
-- Safe to re-run.
--
-- Superseded by migration 006 (P1 #5): public mentor reads go through the
-- column-safe public_mentor_profiles view, never the base `profiles` table
-- (which exposes email/phone). Intentionally NOT recreated here; the drop stays
-- so re-running 001 removes any legacy copy instead of re-opening the leak.
drop policy if exists "profiles: public read mentors" on public.profiles;
