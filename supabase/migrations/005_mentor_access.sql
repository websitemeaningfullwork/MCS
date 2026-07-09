-- Migration 005 — mentor self-service access.
-- Lets a mentor: read + update questions assigned to them, read the answers on
-- those questions, and edit their own mentor profile row. Safe to re-run.

-- Questions assigned to the mentor
drop policy if exists "questions: mentor assigned read" on public.questions;
create policy "questions: mentor assigned read" on public.questions for select
  using (mentor_id = auth.uid());

drop policy if exists "questions: mentor assigned update" on public.questions;
create policy "questions: mentor assigned update" on public.questions for update
  using (mentor_id = auth.uid());

-- Answers on the mentor's assigned questions
drop policy if exists "answers: mentor assigned read" on public.answers;
create policy "answers: mentor assigned read" on public.answers for select
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.mentor_id = auth.uid()
    )
  );

-- A mentor may edit their own mentor row
drop policy if exists "mentors: self update" on public.mentors;
create policy "mentors: self update" on public.mentors for update
  using (id = auth.uid()) with check (id = auth.uid());
