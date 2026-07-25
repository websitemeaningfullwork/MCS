-- ============================================================
-- Migration 015 — release classes that were stranded as drafts
--
-- Context: `createClass` (the Chunk 3 program editor) inserted every new class
-- with `status = 'draft'`, while the student course player only ever queries
-- `status = 'published'`. The legacy admin form never set the column at all, so
-- it inherited the `lessons.status` default of 'published' — the two authoring
-- paths disagreed, and only the newer one produced invisible content.
--
-- The result was a silent delivery failure: an admin could author a course,
-- publish the PROGRAM, sell it, approve the bKash payment, and the buyer would
-- open it to "No lessons yet". It never reproduced for the admin, because an
-- admin previewing a course is served classes in every status.
--
-- The app-side fix (new classes are created published, plus a warning banner
-- and a "publish all drafts" action in the editor) stops this recurring, but
-- courses already sold are still dark until someone clicks that button. This
-- migration releases exactly the unambiguous cases.
--
-- SCOPE — deliberately narrow. A class is published here only when ALL hold:
--   1. its program is `published` (i.e. buyable), AND
--   2. the program has at least one enrollment (someone actually paid for or
--      was granted access to it), AND
--   3. the program currently has ZERO published classes.
--
-- Condition 3 is what makes this safe. A course with some classes published and
-- some in draft is a normal work-in-progress state and is left completely
-- alone — those are judgement calls for the admin, via the editor's banner.
-- Only "sold, and entirely unwatchable" is repaired automatically, where
-- leaving the content hidden cannot be the intended state: a student has paid
-- for a course with nothing in it.
--
-- `hidden` classes are never touched — unlike `draft` (the accidental default),
-- hidden is only ever set deliberately.
--
-- Idempotent: re-running is a no-op, because after the first run those programs
-- no longer satisfy condition 3.
-- ============================================================

do $$
declare
  affected_programs int;
  affected_classes  int;
begin
  with broken_programs as (
    select p.id
    from public.programs p
    where p.status = 'published'
      -- someone has access to it
      and exists (
        select 1 from public.enrollments e where e.program_id = p.id
      )
      -- ...but nothing in it is visible to them
      and not exists (
        select 1
        from public.modules m
        join public.lessons l on l.module_id = m.id
        where m.program_id = p.id
          and l.status = 'published'
      )
      -- ...and there IS draft content that should have been visible
      and exists (
        select 1
        from public.modules m
        join public.lessons l on l.module_id = m.id
        where m.program_id = p.id
          and l.status = 'draft'
      )
  ),
  released as (
    update public.lessons l
      set status = 'published'
    from public.modules m, broken_programs bp
    where l.module_id = m.id
      and m.program_id = bp.id
      and l.status = 'draft'
    returning m.program_id
  )
  select count(*), count(distinct program_id)
    into affected_classes, affected_programs
  from released;

  raise notice
    'Migration 015: published % stranded draft class(es) across % sold program(s).',
    affected_classes, affected_programs;
end $$;
