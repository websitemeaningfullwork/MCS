# MCA — Production Readiness Findings

Full-codebase audit of `websitemeaningfullwork/MCS` (Next.js 16.2.10, React 19, Supabase).
Scope: 297 files / ~32k LOC of TS/TSX, 14 SQL migrations, config, CI.

**Baseline verification performed:** `npm install`, `tsc --noEmit`, `eslint`, `vitest run`, and a
full `next build` were all executed. **All four pass cleanly.** Every finding below was
confirmed by reading the actual source, not inferred from the passing build.

Severity: **P0** = must fix before launch · **P1** = high · **P2** = medium · **P3** = polish

---

## P0 — Launch blockers

### P0-1 · Stored XSS: lesson overview HTML is rendered unsanitized
- `src/components/dashboard/course-player/lesson-tabs.tsx:113` renders
  `dangerouslySetInnerHTML={{ __html: lesson.overview_html }}`.
- `overview_html` is persisted with no sanitization — the schema is bare
  `z.string().nullable().optional()` (`src/features/admin/program-editor-actions.ts:338`).
- There is **no sanitizer dependency in the project at all** (no DOMPurify / sanitize-html).
- The producing editor (`src/components/admin/program-editor/rich-text-editor.tsx`) emits
  raw `ref.current.innerHTML` from a `contentEditable` surface. Paste is not intercepted, so
  arbitrary markup (`<img onerror=…>`, `<iframe>`, inline handlers) survives to the DB.
- Its `addLink()` (line 70) feeds an unvalidated `window.prompt` value straight into
  `document.execCommand("createLink")` — `javascript:` URLs are accepted verbatim.

**Impact:** any admin-account compromise escalates to persistent XSS against every enrolled
student in the course player. **Fix:** sanitize on write (allowlist tags/attrs, drop
`javascript:`/`data:` hrefs and all `on*` handlers) and again on render.

### P0-2 · Stored XSS via unvalidated URL fields (`javascript:` in `href`)
`src/features/mentor/actions.ts` — `updateOwnMentorProfile` has **no Zod schema and no
validation whatsoever**. It writes `linkedin_url`, `whatsapp`, `headline`, and unbounded
`expertise`/`skills` arrays directly to `mentors`.

Those values render as raw anchors:
`src/app/(marketing)/mentors/[id]/page.tsx:254-260` → `<SocialLink href={mentor.facebook_url}>`
→ `<a href={href}>` at line 296.

Migration 005 (`mentors: self update`) grants every mentor UPDATE on their own row, and
`protect_mentors_columns` does not cover the URL columns. So **any mentor account can plant a
`javascript:` URL on a public page.** The admin path is barely better: `mentor-schema.ts` types
these as `z.string().trim().max(300)` — length only, no protocol check.

Across the entire codebase **exactly one URL field is validated** (`profile avatar_url`);
`meeting_url`, `replay_url`, `external_url`, `video_url`, `file_url`, `facebook_url`,
`youtube_url`, `linkedin_url` are all unchecked.

**Fix:** a shared `httpUrl` Zod schema (`z.string().url().refine(protocol ∈ {http,https})`)
applied to every URL column, plus a render-time guard.

### P0-3 · Students can write their own mock-test scores
Migration `000_base_schema.sql` — policy `attempts: own`:
```sql
create policy "attempts: own" on public.test_attempts for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());
```
`FOR ALL` + a check on `user_id` only. A student can `INSERT`/`UPDATE` `test_attempts` directly
through the Supabase REST API with any `score`/`total` they like. The server-side scoring in
`src/features/mock-tests/actions.ts` is correct and careful — but it is entirely bypassable.

**Fix:** restrict students to `SELECT`; write attempts exclusively via the service role in
`submitAttempt` (the same pattern already used for `orders`).

### P0-4 · No Content-Security-Policy
`next.config.ts` ships good baseline headers but the comment concedes CSP was deferred. Given
P0-1 (unsanitized HTML injection) and the iframe passthrough in P1-5, CSP is the missing
compensating control. **Fix:** ship `Content-Security-Policy-Report-Only` now, enforce after
one clean reporting cycle.

---

## P1 — High

### P1-1 · Course progress can never reach 100% when a program has draft lessons
- The player shows students published lessons only:
  `src/app/dashboard/learn/[programSlug]/page.tsx` → `if (!isAdmin) lessonQuery.eq("status","published")`.
- The rollup counts **every** lesson regardless of status:
  `src/features/learning/actions.ts` → `supabase.from("lessons").select("id").in("module_id", moduleIds)` — no status filter.

A student finishes every lesson they can see and the bar stops at, say, 80%; `completed_at` is
never set. Worse, it is inconsistent with the review gate: `isScopeComplete()` in
`src/features/reviews/actions.ts` **does** filter `status = 'published'`, so the "leave a course
review" CTA unlocks on a course the dashboard still reports as incomplete.

**Fix:** add `.eq("status","published")` to the rollup denominator.

### P1-2 · Appointments: past-time slots on the current day are bookable
`getDaySlots()` only rejects whole past dates (`if (dateISO < todayInDhaka()) return { slots: [] }`),
and `createAppointment()` likewise checks only `v.date < todayInDhaka()`. Neither compares the
slot's **time** against the current Dhaka time. At 15:00 a student can book the 09:00 slot today.
**Fix:** filter slots by current time when `dateISO === todayInDhaka()`, server-side.

### P1-3 · Appointments: mentor daily cap (`max_per_day`) is not enforced on create
`getMentorsForSlot()` honours the cap, but `createAppointment()` never reads `max_per_day` — it
only checks the single-slot clash. The cap is UI-only and bypassable by calling the server action
directly. Same gap in `rescheduleAppointment()`.

### P1-4 · Appointments accept duplicate bKash transaction IDs
Orders are protected by `mps_transaction_id_active_uidx` (migration 006), and
`submitManualPayment` returns a friendly `23505` message. The appointment payment path has **no
equivalent** — migration 013 defines no unique index on `appointments.transaction_id`, and
`submitAppointmentPayment` does no duplicate check. The same TrxID can be replayed across
bookings. **Fix:** mirror the partial unique index and the 23505 handler.

### P1-5 · Arbitrary origins can be iframed via the YouTube helper
`src/lib/youtube.ts`:
```ts
if (url && /\/embed\//.test(url)) return url.trim();
```
Any URL containing `/embed/` — `https://attacker.com/embed/x` — is passed through as an iframe
`src` in `YouTubeEmbed`. **Fix:** require a YouTube host before the passthrough.

### P1-6 · Silent write failures in the admin editors
Several admin actions discard the Supabase result and unconditionally report success:
- `src/features/admin/program-actions.ts:113` (`addModule`), `:154` (`addLesson`)
- `src/features/admin/mock-test-actions.ts:109` (`addQuestion`), `:127` (`deleteQuestion`)

A constraint violation or RLS denial produces a success toast and a row that isn't there. The
sibling delete handlers in the same files *do* check `error` — the inconsistency is the tell.

### P1-7 · `saveLiveClass` throws a 500 on a malformed date
`src/features/admin/live-class-actions.ts` validates `starts_at` as `z.string().min(1)` then calls
`new Date(d.starts_at).toISOString()`. An invalid string yields `Invalid Date` and
`.toISOString()` raises `RangeError` — an unhandled server-action exception rather than a
form error. **Fix:** `z.coerce.date()` or an explicit `isNaN` guard.

### P1-8 · An admin can remove the last admin and lock everyone out
`src/features/admin/users-actions.ts` → `setUserRole` has no self-demotion guard and no
"at least one admin must remain" check. Admin role is only assignable through the admin UI, so
the recovery path after a mistake is a manual SQL edit in Supabase. **Fix:** block self-demotion
and refuse the change when it would leave zero admins.

### P1-9 · The bilingual toggle covers almost nothing
Measured i18n coverage (files containing `<T>` / `useLanguage` / `localize`):

| Area | Coverage |
|---|---|
| `(marketing)` | 9 / 19 |
| `dashboard` | **0 / 16** |
| `admin` | **0 / 34** |
| `checkout` | **0 / 2** |
| `appointments` | **0 / 3** |
| `(auth)` | **0 / 4** |
| `mentor` | **0 / 7** |

Additionally, `title_bn`, `description_bn`, and `name_bn` exist in the schema and in
`database.types.ts` but are **referenced nowhere in application code** — every DB-driven string
(program titles, descriptions, blog posts, resources) is English-only regardless of the toggle.

For a Bangladesh-market product the EN/বাংলা switch is currently a marketing-chrome veneer: a
Bengali-preferring user hits English the moment they log in, check out, or book.

### P1-10 · Client-only i18n blocks Bengali SEO entirely
`language-provider.tsx` stores the language in `localStorage` and `getServerSnapshot` returns
`DEFAULT_LANG`. Consequences:
- The server always emits `<html lang="en">`; the real value is patched in a `useEffect` after
  hydration.
- Every URL serves English HTML to crawlers — **no Bengali page is indexable**, no `hreflang`,
  no localized routes.
- Bengali users see a flash of English on every navigation.

---

## P2 — Medium

### P2-1 · Every public catalogue and detail page is uncached SSR
Build output (verified): `/programs`, `/programs/[slug]`, `/mentors`, `/mentors/[id]`,
`/resources`, `/resources/[slug]`, `/blog`, `/blog/[slug]`, `/live-classes`, `/mock-tests`,
`/community` are all `ƒ (Dynamic)`. Only `/` is static (5 min ISR).

The cause is visible in the code: `src/lib/supabase/public.ts` (`createPublicClient`) was written
specifically so public pages could be statically prerendered — and **every one of those pages
still imports the cookie-bound `supabase/server` client instead**, which forces dynamic
rendering. There is also **no `generateStaticParams` anywhere** in `src/app`.

Result: a Supabase round-trip on every catalogue hit, zero CDN caching, slow TTFB on the exact
pages that drive acquisition.

### P2-2 · Checkout advertises course benefits when selling an e-book
`src/app/checkout/page.tsx` renders the same hardcoded `COURSE_BENEFITS` ("HD Video Lessons",
"Live Classes", "Certificate of Completion", "Lifetime Access") and `BONUS_ITEMS` for **both**
`type === "program"` and `type === "resource"`. Buying a PDF e-book promises live classes and a
certificate. That is a refund dispute waiting to happen.

### P2-3 · `discount_bdt` semantics are ambiguous and mislabelled
`effectivePriceBDT()` treats `discount_bdt` as the **final discounted price**, not the amount off.
The two admin forms disagree about what to call it:
- `src/components/admin/program-form.tsx:187` → "Discount **price** (BDT)" ✓
- `src/components/admin/program-editor/program-info-panel.tsx:275` → "**Discount** (BDT)" ✗

An admin who reads the second label and enters `500` meaning "৳500 off" on a ৳5,000 course sells
it for ৳500. Nothing validates `discount < price` either — an out-of-range value is silently
ignored with no feedback.

### P2-4 · Quiz answer keys are shipped to the browser
`src/app/dashboard/learn/[programSlug]/page.tsx` selects `correct_answer` from `quiz_questions`
and passes it into the client `QuizPlayer`, which grades locally. Answers are readable in the
page payload. Contrast with mock tests, which deliberately keep `correct_key` server-side.
Acceptable for a self-check widget; not acceptable if quizzes ever become assessed.

### P2-5 · Reschedule silently downgrades a confirmed, paid booking
`rescheduleAppointment()` sets `status: "rescheduled"` unconditionally. A student who has paid and
been confirmed can reschedule and land in `rescheduled` — out of the `confirmed` set that upcoming
views and mentor lists filter on — with no re-confirmation workflow.

### P2-6 · Unauthenticated, unthrottled service-role queries
`getDaySlots()` and `getMentorsForSlot()` are exported server actions with **no auth check and no
rate limit**, and both call `bookedByMentor()`, which uses `createAdminClient()`. Any anonymous
visitor can enumerate every mentor's availability and session pricing, and drive service-role DB
load, by POSTing to the action endpoint.

### P2-7 · Payment amount is never checked at submission time
`submitManualPayment` validates only `paid_amount_bdt > 0`. A ৳1 submission on a ৳5,000 course is
accepted and queued. `approvePayment` does catch it (it recomputes the trusted total and refuses
underpayment — genuinely well done), but the mismatch is only discovered by a human at review
time. `updateAppointmentPayment` has **no equivalent check at all** for appointments.

### P2-8 · Migrations 001/002 re-open a hole that 006 closes
`001` and `002` both `create policy "profiles: public read mentors" … using (role = 'mentor')`,
exposing full profile rows (email, phone). `006` drops it in favour of the column-safe
`public_mentor_profiles` view. Applied in order this is fine — but the README advertises the
migrations as "idempotent (safe to re-run)", and re-running `002` alone silently restores the
leak. **Fix:** neutralize the policy creation in 001/002, or add an ordering warning.

### P2-9 · README documents the wrong migration range
README says "Apply every migration in filename order (`000` → `008`)" and repeats `000`–`008`
three times. The repo ships **`000` through `013`** — `009` (site settings), `010` (LMS),
`011` (reviews), `012` (mentor management), `013` (appointments). A deployer following the README
brings up a database missing five of the app's core feature tables.

### P2-10 · Test coverage is effectively zero for anything stateful
7 test files, all pure-function unit tests (`slots`, `format`, `site-url`, `slug`, `youtube`, and
two schema files). `vitest.config.ts` sets `include: ["src/**/*.test.ts"]` — `.tsx` is excluded,
so component tests cannot even run without a config change. There is **no coverage of** server
actions, the payment approve/reject state machine, RLS policies, auth flows, or any component,
and no E2E suite. CI runs lint + typecheck + these 7 files + build.

For a system that moves money through a manual verification workflow, the approval logic in
`src/features/payments/admin-actions.ts` is the single highest-value untested code in the repo.

### P2-11 · No error monitoring or analytics
`global-error.tsx` and the route `error.tsx` boundaries only `console.error`. In production that
means server-action failures, RLS denials, and client crashes are invisible. No Sentry, no
OpenTelemetry, no analytics of any kind.

### P2-12 · In-memory rate limiter is a no-op on serverless
`src/lib/rate-limit.ts` keeps buckets in a per-instance `Map`. The file documents this honestly,
but the deployment target is Vercel, where the login, signup, password-reset, contact, and payment
limits it backs are effectively unenforced across the lambda fleet. **Fix:** Upstash/Redis or a DB
counter before launch.

---

## P3 — Polish

- **Navbar auth flash.** `src/components/shared/navbar.tsx` loads auth client-side in a
  `useEffect`, so signed-in users see the logged-out "Login" state on every page load until
  hydration resolves. No skeleton state.
- **Icon-only buttons with no accessible name.** e.g.
  `src/components/admin/program-editor/quiz-manager.tsx:169,173` — no `aria-label`, no `title`.
  `reviews-table.tsx` relies on `title=` alone, which is weak and invisible on touch.
- **8 native `confirm()` / `window.prompt()` dialogs** for destructive actions (delete review,
  delete season/class, cancel appointment, delete appointment type…) despite a shadcn `Dialog`
  component being available. Unstyled, unlocalized, and suppressible by the browser.
- **Hardcoded marketing metrics.** `src/app/page.tsx` ships "5,000+ Students", "94% Success Rate",
  "25,000+ Questions Answered" as literals. If these aren't defensible, they're a claims problem.
- **Gender pre-selected** to `"male"` in the booking wizard's default state
  (`booking-wizard.tsx`), rather than forcing a deliberate choice.
- **Sitemap gaps.** `src/app/sitemap.ts` omits `/appointments`, `/privacy`, `/terms`, `/refund`
  and all `/mock-tests/[slug]` detail routes. No `alternates.canonical` anywhere in the app.
- **Missing error boundaries** for the `(marketing)`, `mentor`, and `appointments` segments (they
  fall through to the root boundary); `appointments` also has no `loading.tsx`.
- **`shadcn` CLI (v4.13.0) is in `dependencies`**, not `devDependencies` — it ships to production
  installs. The `radix-ui` umbrella package is likewise pulled in whole.
- **`deleteMentor` error message is stale.** It names programs, questions, and live classes as
  blockers, but `appointments.mentor_id` is `ON DELETE RESTRICT` (migration 013) and is now the
  most likely cause of a failed delete.
- **Hand-rolled URL encoding** in `src/app/checkout/page.tsx`:
  `redirect(\`/login?next=/checkout?type=${type}%26id=${id}\`)`. It happens to work; it should be
  `encodeURIComponent`.
- **`enrollments.progress` denominator uses `|| 1`** (`learning/actions.ts`), so a program with
  zero lessons reports 0% rather than being treated as not-applicable.
- **`changeAppointmentMentor` doesn't reprice.** Moving a booking to a mentor with a different
  `session_price_bdt` leaves the original `amount_bdt` in place.
- **Node version drift.** `.nvmrc` = 22, `package.json engines` = `>=20.9.0`, CI = 22. Harmless
  today, but the floor should match the tested version.

---

## What is genuinely solid

Worth stating plainly, because it shapes where effort should go:

- **The payment approval path is careful.** `approvePayment` recomputes the trusted total from
  source tables, refuses underpayment, grants access *before* advancing status so a failure can't
  strand a paid buyer, and is idempotent. `rejectPayment` correctly revokes access on a
  previously-approved submission.
- **RLS is real and layered.** Column-guard triggers (`protect_profiles_columns`,
  `protect_mentors_columns`, `protect_reviews_status`, `protect_appointments`) stop privilege
  escalation at the database, not just in the app. The `public_*` view pattern for column-safe
  anon reads is applied consistently.
- **Open-redirect handling is correct.** `safeNextPath()` rejects `//evil.com`, backslash tricks,
  and control characters, and is actually wired into both the OAuth callback and the login form.
- **Server-side scoring and price computation** never trust the client (mock tests, checkout,
  free enrollment all re-verify server-side).
- **The proxy fails closed** when Supabase env vars are missing.
- Typecheck, lint, tests, and production build are all clean.

## Suggested order of work

1. **P0-1 / P0-2** — sanitize HTML, validate every URL field. Smallest diff, largest risk removed.
2. **P0-3** — lock down `test_attempts` writes.
3. **P1-1 → P1-8** — the correctness bugs; each is a few lines and independently shippable.
4. **P2-12 + P2-11** — durable rate limiting and error monitoring, before real traffic.
5. **P1-9 / P1-10** — decide whether bilingual is a product commitment. If yes, it needs routed
   locales and translated DB content, not more `<T>` tags.
6. **P2-1** — switch public pages to `createPublicClient` + `generateStaticParams`.
7. **P2-10** — tests around the payment state machine first, then the RLS policies.
