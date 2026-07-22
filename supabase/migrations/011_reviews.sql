-- ============================================================
-- Migration 011 — Review System (lesson / season / course)
--
-- Chunk 5 of the "fully redesign the website" effort. Students may optionally
-- leave a rating + review once they have *meaningfully completed* a lesson, a
-- season (all published classes in a module), or the whole course. Reviews are
-- moderated by admins; only approved reviews surface publicly on the homepage
-- "Student Success Stories" carousel, the program details page, and the course
-- player's Reviews tab. Students manage their own from Dashboard → My Reviews.
--
-- Design:
--   • One `reviews` table, discriminated by `scope` (lesson|season|course).
--   • Completion is enforced in the server action (features/reviews/actions.ts),
--     which runs with the user session; RLS keeps writes scoped to the owner and
--     forces new/edited reviews back to 'pending'. A column-guard trigger stops
--     students from self-approving (mirrors protect_mentors_columns, mig 006).
--   • Public reads go through the `public_reviews` view (approved only, joined to
--     the reviewer's name/avatar) — the same pattern as public_mentor_profiles,
--     so the base `profiles` table stays unexposed.
--   • Rating aggregates (programs.rating / reviews_count and mentors.*) are NOT
--     recomputed by a DB trigger — they are recomputed by the moderation server
--     action via the service-role client, which passes the mig-006 column guards.
--
-- All statements are idempotent. RLS ON with explicit policies.
-- ============================================================

-- ------------------------------------------------------------
-- 1. reviews
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  scope      text not null default 'course',      -- lesson | season | course
  lesson_id  uuid references public.lessons(id) on delete cascade,   -- scope=lesson
  module_id  uuid references public.modules(id) on delete cascade,   -- scope=season
  rating     int  not null,
  body       text,
  status     text not null default 'pending',     -- pending|approved|hidden|reported
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$ begin
  alter table public.reviews
    add constraint reviews_scope_chk check (scope in ('lesson','season','course'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.reviews
    add constraint reviews_status_chk
    check (status in ('pending','approved','hidden','reported'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.reviews
    add constraint reviews_rating_chk check (rating between 1 and 5);
exception when duplicate_object then null; end $$;

-- Each target may be reviewed once per student.
create unique index if not exists reviews_uniq_lesson
  on public.reviews (user_id, lesson_id) where scope = 'lesson';
create unique index if not exists reviews_uniq_season
  on public.reviews (user_id, module_id) where scope = 'season';
create unique index if not exists reviews_uniq_course
  on public.reviews (user_id, program_id) where scope = 'course';

create index if not exists reviews_program_status_idx on public.reviews(program_id, status);
create index if not exists reviews_user_id_idx        on public.reviews(user_id);
create index if not exists reviews_status_scope_idx    on public.reviews(status, scope);

-- ------------------------------------------------------------
-- 2. Column guard — students can create/edit their own review but may never set
--    or keep a privileged status. Admins & the service role bypass the guard.
-- ------------------------------------------------------------
create or replace function public.protect_reviews_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  -- Non-admins: any new/edited row is forced to 'pending' moderation.
  new.status := 'pending';
  return new;
end;$$;

drop trigger if exists trg_protect_reviews_status on public.reviews;
create trigger trg_protect_reviews_status
  before insert or update on public.reviews
  for each row execute function public.protect_reviews_status();

-- Keep updated_at fresh.
create or replace function public.touch_reviews_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;$$;
drop trigger if exists trg_touch_reviews_updated_at on public.reviews;
create trigger trg_touch_reviews_updated_at
  before update on public.reviews
  for each row execute function public.touch_reviews_updated_at();

-- ------------------------------------------------------------
-- 3. Row Level Security
-- ------------------------------------------------------------
alter table public.reviews enable row level security;

-- Students read their own reviews (any status).
drop policy if exists "reviews: read own" on public.reviews;
create policy "reviews: read own" on public.reviews
  for select using (user_id = auth.uid());

-- Anyone (incl. anon) may read approved reviews from the base table too; the
-- public_reviews view is preferred for surfacing reviewer identity.
drop policy if exists "reviews: read approved" on public.reviews;
create policy "reviews: read approved" on public.reviews
  for select using (status = 'approved');

-- Admins read/moderate everything.
drop policy if exists "reviews: admin read" on public.reviews;
create policy "reviews: admin read" on public.reviews
  for select using (public.is_admin());

-- Student writes own rows (completion is enforced in the server action; the
-- status guard trigger forces 'pending'). Insert requires an active enrollment.
drop policy if exists "reviews: student insert own" on public.reviews;
create policy "reviews: student insert own" on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.program_id = reviews.program_id
    )
  );

drop policy if exists "reviews: student update own" on public.reviews;
create policy "reviews: student update own" on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reviews: student delete own" on public.reviews;
create policy "reviews: student delete own" on public.reviews
  for delete using (user_id = auth.uid());

-- Admin full write (approve / hide / delete).
drop policy if exists "reviews: admin write" on public.reviews;
create policy "reviews: admin write" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 4. public_reviews — approved reviews joined to reviewer + program, column-safe.
--    Runs with the view owner's rights (like public_mentor_profiles), so the
--    base `profiles`/`reviews` tables stay unexposed to anon.
-- ------------------------------------------------------------
create or replace view public.public_reviews as
  select
    r.id,
    r.program_id,
    r.scope,
    r.lesson_id,
    r.module_id,
    r.rating,
    r.body,
    r.created_at,
    p.full_name  as reviewer_name,
    p.avatar_url as reviewer_avatar,
    prog.title   as program_title,
    prog.slug    as program_slug,
    exists (
      select 1 from public.enrollments e
      where e.user_id = r.user_id and e.program_id = r.program_id
    ) as verified_buyer
  from public.reviews r
  join public.profiles p    on p.id = r.user_id
  join public.programs prog on prog.id = r.program_id
  where r.status = 'approved';

grant select on public.public_reviews to anon, authenticated;
