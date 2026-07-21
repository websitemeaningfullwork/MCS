-- ============================================================
-- Migration 010 — Course Management System (LMS) data model
--
-- Chunk 3 of the "fully redesign the website" effort. Turns the basic
-- Program → Modules → Lessons CRUD into a full LMS:
--   Program → Seasons (modules) → Classes (lessons), where each class carries
--   a YouTube video, a rich-text overview, unlimited resources, a quiz (Q&A),
--   and student notes — all editable from one autosaving admin workspace.
--
-- Reuses the existing tables per the master plan's gap analysis:
--   • `modules`  == Seasons   (adds `subtitle`)
--   • `lessons`  == Classes    (adds overview_html, thumbnail_url, status, admin_notes)
-- and adds four net-new tables:
--   • program_mentors  — multi-mentor assignment (many-to-many + primary flag)
--   • lesson_resources — files / links attached to a class
--   • quizzes          — one quiz per class (Q&A)
--   • quiz_questions   — the questions inside a quiz
--
-- Every new table gets RLS ON with explicit policies. Content reads mirror the
-- existing `lessons` policy (preview OR enrolled OR admin) so Chunk 4's course
-- player can consume this data directly. All statements are idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Program status — add 'hidden' (spec: Draft / Published / Hidden).
--    Top-level ADD VALUE IF NOT EXISTS is idempotent; the value is only USED by
--    later migrations / app code, never inside this same transaction.
-- ------------------------------------------------------------
alter type program_status add value if not exists 'hidden';

-- ------------------------------------------------------------
-- 2. Seasons (modules): a short subtitle line under the season name.
-- ------------------------------------------------------------
alter table public.modules add column if not exists subtitle text;

-- ------------------------------------------------------------
-- 3. Classes (lessons): rich overview, thumbnail, per-class status, admin notes.
--    `video_url` (YouTube) and `duration_seconds` already exist and are reused.
-- ------------------------------------------------------------
alter table public.lessons add column if not exists overview_html text;
alter table public.lessons add column if not exists thumbnail_url text;
alter table public.lessons add column if not exists admin_notes   text;
alter table public.lessons add column if not exists status        text not null default 'published';

do $$ begin
  alter table public.lessons
    add constraint lessons_status_chk check (status in ('draft','published','hidden'));
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 4. program_mentors — many-to-many program↔mentor with a primary flag.
-- ------------------------------------------------------------
create table if not exists public.program_mentors (
  program_id uuid not null references public.programs(id) on delete cascade,
  mentor_id  uuid not null references public.mentors(id)  on delete cascade,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  primary key (program_id, mentor_id)
);
create index if not exists program_mentors_mentor_id_idx on public.program_mentors(mentor_id);

-- Backfill from the legacy single `programs.mentor_id` so existing assignments
-- surface in the new multi-mentor editor. Idempotent.
insert into public.program_mentors (program_id, mentor_id, is_primary, sort_order)
select p.id, p.mentor_id, true, 0
from public.programs p
where p.mentor_id is not null
on conflict (program_id, mentor_id) do nothing;

-- ------------------------------------------------------------
-- 5. lesson_resources — unlimited files / links per class.
-- ------------------------------------------------------------
create table if not exists public.lesson_resources (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  type text not null default 'link',            -- pdf|docx|ppt|zip|link|drive|other
  file_url text,                                 -- public URL (uploaded asset)
  external_url text,                             -- external / drive link
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists lesson_resources_lesson_id_idx on public.lesson_resources(lesson_id);

do $$ begin
  alter table public.lesson_resources
    add constraint lesson_resources_type_chk
    check (type in ('pdf','docx','ppt','zip','link','drive','other'));
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 6. quizzes — one Q&A quiz per class (created lazily when first question added).
-- ------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text default 'Class Quiz',
  created_at timestamptz default now(),
  unique (lesson_id)
);

-- ------------------------------------------------------------
-- 7. quiz_questions — the questions inside a quiz.
-- ------------------------------------------------------------
create table if not exists public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null default 'mcq',              -- mcq|true_false|short
  question text not null,
  options jsonb not null default '[]'::jsonb,     -- array of option strings (mcq)
  correct_answer text,                            -- option text | 'true'/'false' | free text
  explanation text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

do $$ begin
  alter table public.quiz_questions
    add constraint quiz_questions_type_chk check (type in ('mcq','true_false','short'));
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 8. Row Level Security
-- ------------------------------------------------------------
alter table public.program_mentors  enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.quizzes          enable row level security;
alter table public.quiz_questions   enable row level security;

-- program_mentors: public read (assignments are shown on program/mentor pages),
-- admin write.
drop policy if exists "program_mentors: public read" on public.program_mentors;
create policy "program_mentors: public read" on public.program_mentors
  for select using (true);
drop policy if exists "program_mentors: admin write" on public.program_mentors;
create policy "program_mentors: admin write" on public.program_mentors
  for all using (public.is_admin()) with check (public.is_admin());

-- lesson_resources: readable when the parent class is readable (preview OR
-- enrolled OR admin) — mirrors the `lessons` select policy. Admin writes.
drop policy if exists "lesson_resources: read via lesson" on public.lesson_resources;
create policy "lesson_resources: read via lesson" on public.lesson_resources
  for select using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = lesson_resources.lesson_id
        and (
          l.is_preview = true
          or public.is_admin()
          or exists (
            select 1 from public.enrollments e
            where e.user_id = auth.uid() and e.program_id = m.program_id
          )
        )
    )
  );
drop policy if exists "lesson_resources: admin write" on public.lesson_resources;
create policy "lesson_resources: admin write" on public.lesson_resources
  for all using (public.is_admin()) with check (public.is_admin());

-- quizzes: same read gate as the parent class; admin writes.
drop policy if exists "quizzes: read via lesson" on public.quizzes;
create policy "quizzes: read via lesson" on public.quizzes
  for select using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      where l.id = quizzes.lesson_id
        and (
          l.is_preview = true
          or public.is_admin()
          or exists (
            select 1 from public.enrollments e
            where e.user_id = auth.uid() and e.program_id = m.program_id
          )
        )
    )
  );
drop policy if exists "quizzes: admin write" on public.quizzes;
create policy "quizzes: admin write" on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

-- quiz_questions: readable when the owning quiz's class is readable; admin writes.
drop policy if exists "quiz_questions: read via quiz" on public.quiz_questions;
create policy "quiz_questions: read via quiz" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes q
      join public.lessons l on l.id = q.lesson_id
      join public.modules m on m.id = l.module_id
      where q.id = quiz_questions.quiz_id
        and (
          l.is_preview = true
          or public.is_admin()
          or exists (
            select 1 from public.enrollments e
            where e.user_id = auth.uid() and e.program_id = m.program_id
          )
        )
    )
  );
drop policy if exists "quiz_questions: admin write" on public.quiz_questions;
create policy "quiz_questions: admin write" on public.quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 9. Storage — public bucket for program covers & class thumbnails.
--    Public read (images are shown to visitors); admin-only writes.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('course-assets', 'course-assets', true)
on conflict (id) do nothing;

drop policy if exists "course-assets: public read" on storage.objects;
create policy "course-assets: public read" on storage.objects
  for select using (bucket_id = 'course-assets');

drop policy if exists "course-assets: admin write" on storage.objects;
create policy "course-assets: admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'course-assets' and public.is_admin())
  with check (bucket_id = 'course-assets' and public.is_admin());
