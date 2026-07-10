-- ============================================================
-- Migration 007 — scope answers INSERT to the question (P1 security)
--
-- The original "answers: auth insert" policy only checked author_id = auth.uid(),
-- so ANY authenticated user could inject a reply onto ANY question id via a
-- direct API call (bypassing the postAnswer server action's own checks). This
-- ties the insert to questions the caller may actually participate in.
-- Idempotent / safe to re-run.
-- ============================================================

drop policy if exists "answers: auth insert" on public.answers;
create policy "answers: auth insert" on public.answers for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.student_id = auth.uid()
          or q.mentor_id = auth.uid()
          or q.visibility = 'community'
          or public.is_admin()
        )
    )
  );
