-- ============================================================
-- Migration 012 — Mentor Management (Admin redesign)
--
-- Chunk 6 of the "fully redesign the website" effort. Turns the basic mentor
-- record into a full administration profile: contact info + per-field visibility
-- toggles, professional details, availability schedule, session pricing, social
-- links, and lifecycle status — all editable from one admin page (mentors.jpg)
-- and consumed by the public site + (next) the appointment system.
--
-- IMPORTANT — deploy WITH the matching app code. This migration LOCKS DOWN the
-- base `mentors` table (previously world-readable) so newly-added `phone`/`email`
-- can't be scraped, and routes public reads through a visibility-gated
-- `public_mentors` view (same hardening pattern as migration 006 for profiles).
-- Bio continues to live on `profiles.bio` (reused, not duplicated).
--
-- All statements idempotent. RLS stays ON.
-- ============================================================

-- ------------------------------------------------------------
-- 1. New mentor columns
-- ------------------------------------------------------------
alter table public.mentors add column if not exists phone                 text;
alter table public.mentors add column if not exists email                 text;
alter table public.mentors add column if not exists show_phone            boolean not null default true;
alter table public.mentors add column if not exists show_whatsapp         boolean not null default true;
alter table public.mentors add column if not exists show_email            boolean not null default false;
alter table public.mentors add column if not exists highest_qualification text;
alter table public.mentors add column if not exists current_position      text;
alter table public.mentors add column if not exists organization          text;
-- availability jsonb: { working_days: string[], start_time, end_time, breaks: [{start,end}] }
alter table public.mentors add column if not exists availability          jsonb not null default '{}'::jsonb;
alter table public.mentors add column if not exists session_duration      int;                 -- minutes
alter table public.mentors add column if not exists session_price_bdt     numeric(10,2) not null default 0;
alter table public.mentors add column if not exists currency              text not null default 'BDT';
alter table public.mentors add column if not exists facebook_url          text;
alter table public.mentors add column if not exists youtube_url           text;
alter table public.mentors add column if not exists is_active             boolean not null default true;
alter table public.mentors add column if not exists sort_order            int not null default 0;
alter table public.mentors add column if not exists status                text not null default 'active';

do $$ begin
  alter table public.mentors
    add constraint mentors_status_chk check (status in ('active','inactive','hidden','draft'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.mentors
    add constraint mentors_session_price_nonneg_chk check (session_price_bdt >= 0);
exception when duplicate_object then null; end $$;

create index if not exists mentors_status_active_idx on public.mentors(status, is_active, sort_order);

-- ------------------------------------------------------------
-- 2. Extend the mig-006 column guard: students/mentors may not self-set the
--    admin-controlled lifecycle/trust fields. Admin + service role bypass.
-- ------------------------------------------------------------
create or replace function public.protect_mentors_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.rating          is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.is_verified   is distinct from old.is_verified
     or new.is_featured   is distinct from old.is_featured
     or new.is_active     is distinct from old.is_active
     or new.status        is distinct from old.status
     or new.sort_order    is distinct from old.sort_order then
    raise exception 'Not allowed to modify protected mentor fields';
  end if;
  return new;
end;$$;

-- ------------------------------------------------------------
-- 3. Lock the base table: own-or-admin reads only (was world-readable).
--    Public/anon reads now go through public_mentors (below).
-- ------------------------------------------------------------
drop policy if exists "mentors: public read" on public.mentors;
drop policy if exists "mentors: read own or admin" on public.mentors;
create policy "mentors: read own or admin" on public.mentors
  for select using (public.is_admin() or id = auth.uid());

-- ------------------------------------------------------------
-- 4. public_mentors — column-safe, visibility-gated public view. Runs with the
--    view owner's rights (like public_mentor_profiles) so it bypasses the locked
--    base table. Only publicly-visible mentors (active) are exposed; contact
--    fields are nulled unless their show_* toggle is on.
-- ------------------------------------------------------------
create or replace view public.public_mentors as
  select
    m.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    m.headline,
    m.expertise,
    m.skills,
    m.years_experience,
    m.highest_qualification,
    m.current_position,
    m.organization,
    m.rating,
    m.reviews_count,
    m.is_verified,
    m.is_featured,
    m.is_active,
    m.sort_order,
    m.status,
    m.availability,
    m.session_duration,
    m.session_price_bdt,
    m.currency,
    m.facebook_url,
    m.youtube_url,
    m.linkedin_url,
    case when m.show_phone    then m.phone    end as phone,
    case when m.show_whatsapp then m.whatsapp end as whatsapp,
    case when m.show_email    then m.email    end as email
  from public.mentors m
  join public.profiles p on p.id = m.id
  where p.role = 'mentor'
    and coalesce(m.is_active, true)
    and coalesce(m.status, 'active') = 'active';

grant select on public.public_mentors to anon, authenticated;

-- ------------------------------------------------------------
-- 5. Storage: let admins manage any avatar (base policy only allows own folder).
--    Needed so an admin can upload a mentor's profile photo to `${mentorId}/…`.
-- ------------------------------------------------------------
drop policy if exists "avatars: admin write" on storage.objects;
create policy "avatars: admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());
