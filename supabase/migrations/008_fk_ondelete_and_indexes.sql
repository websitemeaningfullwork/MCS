-- ============================================================
-- Migration 008 — FK ON DELETE hardening + missing indexes + updated_at trigger
--
-- Addresses production-audit findings:
--   DB-2 (P1): several FKs into profiles/mentors had no ON DELETE, defaulting to
--     NO ACTION (restrict). Deleting a user/mentor who authored content or
--     reviewed a payment was blocked — and deleteMentor ignored the error, so the
--     UI falsely reported success. Switch these to ON DELETE SET NULL (all the
--     columns are already nullable), so the parent can be removed and the child
--     row survives with a null reference.
--   DB-4 (P2): missing indexes on hot filtered/paginated columns.
--   DB-3 (P2): no updated_at auto-update trigger (freshness relied on every
--     writer remembering to set it).
--   DB-5/L1 (P3): drop three indexes that duplicate existing PK/UNIQUE indexes.
--
-- Idempotent / safe to re-run.
-- ============================================================

-- ---- DB-2: FK ON DELETE SET NULL ---------------------------------------------
-- Postgres named these constraints <table>_<column>_fkey when they were created
-- inline in migration 000. Drop-then-recreate is the only way to change ON DELETE.

alter table public.questions      drop constraint if exists questions_mentor_id_fkey;
alter table public.questions      add  constraint questions_mentor_id_fkey
  foreign key (mentor_id) references public.mentors(id) on delete set null;

alter table public.answers        drop constraint if exists answers_author_id_fkey;
alter table public.answers        add  constraint answers_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.blog_posts     drop constraint if exists blog_posts_author_id_fkey;
alter table public.blog_posts     add  constraint blog_posts_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.programs       drop constraint if exists programs_mentor_id_fkey;
alter table public.programs       add  constraint programs_mentor_id_fkey
  foreign key (mentor_id) references public.mentors(id) on delete set null;

alter table public.live_classes   drop constraint if exists live_classes_mentor_id_fkey;
alter table public.live_classes   add  constraint live_classes_mentor_id_fkey
  foreign key (mentor_id) references public.mentors(id) on delete set null;

alter table public.manual_payment_submissions
  drop constraint if exists manual_payment_submissions_reviewed_by_fkey;
alter table public.manual_payment_submissions
  add  constraint manual_payment_submissions_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles(id) on delete set null;

-- ---- DB-4: missing indexes on hot filtered/paginated columns -----------------
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);
create index if not exists test_attempts_user_id_idx
  on public.test_attempts (user_id);

-- ---- DB-3: updated_at auto-update trigger ------------------------------------
-- moddatetime ships with Supabase; keeps updated_at honest regardless of whether
-- a given writer remembers to set it.
create extension if not exists moddatetime schema extensions;

do $$
declare t text;
begin
  foreach t in array array['profiles','programs','orders','payment_settings']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function extensions.moddatetime(updated_at);', t);
  end loop;
end $$;

-- ---- DB-5/L1: drop redundant indexes (covered by existing PK/UNIQUE) ---------
drop index if exists public.lesson_progress_user_lesson_idx;   -- = PK(user_id, lesson_id)
drop index if exists public.resource_access_user_id_idx;       -- covered by unique(user_id, resource_id)
drop index if exists public.enrollments_user_program_idx;      -- = unique(user_id, program_id)
