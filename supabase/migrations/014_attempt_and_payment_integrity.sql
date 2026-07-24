-- ============================================================
-- Migration 014 — attempt & payment integrity
--
-- Two data-integrity holes left open after the 006 hardening pass:
--
-- P0 — `test_attempts` scores were self-reportable. The base policy
--   ("attempts: own", migration 000) was `for all` with a `with check` that
--   only bound `user_id`, so any authenticated student could POST/PATCH a
--   `test_attempts` row through the REST API with an arbitrary `score`/`total`
--   (and could rewrite an old attempt after seeing the answers). The
--   server-side scoring in `submitAttempt` was correct but entirely
--   bypassable. Attempts now follow the same shape as orders/order_items/
--   manual_payment_submissions after 006: owner + admin may READ, and every
--   write goes through the service role, which computes the trusted score.
--
-- P1 — appointment bKash TrxIDs were replayable. Orders are protected by
--   `mps_transaction_id_active_uidx` (006) but migration 013 shipped the
--   self-contained appointment payment path without an equivalent guard, so
--   one transaction id could be pasted into any number of bookings. Adds the
--   matching partial unique index.
--
-- All statements idempotent / safe to re-run.
--
-- IMPORTANT: deploy this migration TOGETHER with the matching app code —
-- `submitAttempt` must write attempts with the service-role client, otherwise
-- every submission silently loses its history row.
-- ============================================================

-- ============================================================
-- P0 — test_attempts: scores are server-written only
-- ============================================================
-- Replace the `for all` owner policy with a read-only one. There is
-- deliberately NO student INSERT/UPDATE/DELETE policy and no admin write
-- policy: attempts are created exclusively server-side via the service role
-- (which bypasses RLS) in `submitAttempt`, where the answer key is read and
-- the score is computed. A student can still see their own history; admins
-- still see everyone's.
drop policy if exists "attempts: own" on public.test_attempts;

drop policy if exists "attempts: own or admin read" on public.test_attempts;
create policy "attempts: own or admin read" on public.test_attempts for select
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- P1 — appointments: one live booking per bKash transaction id
-- ============================================================
-- Mirrors `mps_transaction_id_active_uidx` (006) for the self-contained
-- appointment payment path.
--
-- Predicate rationale:
--   * `transaction_id is not null` — a booking is created `unpaid` with no
--     TrxID and only gets one when the student submits payment. Postgres
--     already treats NULLs as distinct in a unique index, so this is not
--     strictly required for correctness, but it keeps the index off the many
--     unpaid rows and documents the intent.
--   * `payment_status <> 'refunded'` — the id must stay burned for as long as
--     the money is actually held. Once a booking is refunded the payment has
--     been returned, so a genuine re-submission of that TrxID is legitimate
--     and should not be permanently blocked (the same reasoning that lets a
--     `rejected` manual payment submission be re-sent).
--   * Intentionally NOT keyed on `status <> 'cancelled'`: a cancelled booking
--     that was never refunded still has real money attached to its TrxID, and
--     freeing the id there would let the same payment be replayed onto a new
--     booking. Only an actual refund releases it.
--
-- NOTE: if a database already contains duplicate live TrxIDs this will fail —
-- resolve those rows (refund or clear the duplicate `transaction_id`) first.
create unique index if not exists appointments_transaction_id_active_uidx
  on public.appointments (transaction_id)
  where transaction_id is not null and payment_status <> 'refunded';
