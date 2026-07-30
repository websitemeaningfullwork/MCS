# MCA — Project State

> **This is the single source of truth for "where the project is right now."**
> Read it first in every new session. It replaces the old scattered state docs
> (`PROJECT_CONTEXT.md`, `HANDOVER.md`, and the four production-audit reports),
> which were deleted on 2026-07-27 because they contradicted each other.
>
> **Last updated:** 2026-07-30 · **HEAD:** `6f4ef2d` (+ uncommitted hero-image swap) · **Branch:** `main`

---

## 0. Protocol — read this part every time

**At the start of a session**

1. Read this whole file. §4 (state), §6 (conventions), §7 (gotchas), §9 (open work)
   are the ones that change what you do.
2. Obey `AGENTS.md`: *"This is NOT the Next.js you know."* Before writing any
   App Router / caching / route-API code, read the relevant guide in
   `node_modules/next/dist/docs/`. Installed version is **Next.js 16.2.10**.
3. If `node_modules` looks stale (typecheck fails on a missing package), run
   `npm install` — the lockfile is authoritative.

**At the end of any session that changed something**

Update this file *in the same session, before you report done*. Specifically:

| You changed | Update |
|---|---|
| Any code | §11 Session log (one entry, newest first) + the header date/HEAD |
| A feature's completeness | §4 Feature inventory |
| Added/applied a migration | §5 Migration table + "latest applied" line |
| Fixed or found an issue | §9 Open work (move it out / add it in) |
| A convention or a hard-won bug lesson | §6 or §7 |
| Added/removed a doc | §10 Doc map |

Keep it factual. "Code-complete, migration not applied" is a real and important
state — say that rather than "done". If you could not verify something, say so.

**Do not create new status/audit/summary markdown files.** Findings go in §9,
history goes in §11. That rule is why this file exists.

---

## 1. What the product is

**Meaningful Career Academy (MCA)** — a premium, **mentorship-first** education
platform for Bangladesh. Mentorship is the product; courses, e-books, live
classes, mock tests, Ask-a-Mentor, blog and community support it.

- **Live:** https://mcs-pi.vercel.app
- **Repo:** https://github.com/websitemeaningfullwork/MCS (`main`)
- **Host:** Vercel — auto-deploys on every push to `main`
- **Backend:** Supabase (project ref `vtfallczxbgdataohthu`, Singapore) — the only backend
- **Payments:** manual **bKash**, verified by an admin. No automatic gateway.

**The one-line test for any UI decision:** a visitor should feel *"this is where
someone will personally guide me toward my career"* — not *"this site wants to
sell me a course."*

---

## 2. Stack (locked)

Next.js **16.2.10** (App Router, RSC, TS strict, Turbopack) · React **19.2.4** ·
Tailwind CSS **v4** (`@theme` in `src/styles/globals.css`) · shadcn/ui + Radix +
lucide-react · react-hook-form + zod v4 · Framer Motion (subtle) · Supabase
(`@supabase/ssr`, typed with `<Database>`) · react-markdown + remark-gfm ·
sanitize-html · vitest.

Scale: ~291 TS/TSX files under `src/`, 16 SQL migrations, 9 test files / 80 tests.

---

## 3. Repo map

```
src/
  app/
    (marketing)/  about contact programs mentors resources blog community
                  live-classes mock-tests privacy refund terms  (+ [slug]/[id])
    (auth)/       login register forgot-password reset-password
    auth/callback/  code exchange (OAuth / email confirm / recovery)
    appointments/ public 5-step booking wizard → [id]/pay → [id]/confirmation
    checkout/     manual bKash checkout
    dashboard/    student area — learn/[programSlug] (course player), orders,
                  questions, resources, programs, reviews, appointments,
                  bookmarks, settings
    mentor/       mentor panel — profile, programs, questions
    admin/        programs (LMS editor), mentors, resources, blog, live-classes,
                  mock-tests, payments, questions, reviews, users, settings,
                  appointments (+ /all /calendar /schedule /types)
    page.tsx      HOMEPAGE · sitemap.ts · robots.ts · opengraph-image.tsx
  components/   ui/ (shadcn) · marketing/ · dashboard/ (+course-player/) ·
                admin/ (+program-editor/, appointments/) · mentor/ · checkout/ ·
                appointments/ · reviews/ · mock-tests/ · shared/
  features/     auth contact payments profile questions learning mock-tests
                mentor bookmarks reviews appointments notifications admin/*
                (server actions + zod schemas — validate on the server)
  lib/          supabase/{server,browser,admin,public}.ts · admin-guard ·
                mentor-guard · safe-url · sanitize-html · rate-limit ·
                observability · site-settings · i18n · youtube · constants ·
                format · slug · pagination · email · motion · utils
  types/        database.types.ts  (hand-authored — update by hand per migration)
  styles/       globals.css  (Tailwind v4 @theme tokens)
  proxy.ts      session refresh + route guards (this is Next 16's middleware)
supabase/migrations/  000..015  — SINGLE SOURCE OF TRUTH, apply in filename order
```

---

## 4. Feature inventory — what is built

Everything below is **shipped and live** unless flagged.

**Public:** Home (hero, feature cards, About MCA, programs, mentors, Continue
Journey, Ask a Mentor, stats, Student Success Stories carousel driven by real
approved reviews, Achievements gallery, 4-column footer with social-proof strip,
Programs mega menu) · About · Contact · Programs (list + detail w/ curriculum,
sticky enrol card, Reviews tab) · Mentors (list + detail, visibility-gated
contact, session price, availability, socials) · Resources/E-books · Blog ·
Community · Live Classes · Mock Tests (server-scored attempts) · Appointments
booking wizard · privacy/terms/refund.

**Auth:** email + Google. Roles `student` / `mentor` / `admin`. Signup trigger
auto-creates `profiles`. `safeNextPath()` guards the post-login redirect.

**Student dashboard:** overview · my programs · my resources (signed-URL
download) · my orders (+ detail, resubmit on reject) · Ask-a-Mentor (thread +
follow-up) · My Reviews · My Appointments (cancel / reschedule / join / pay) ·
bookmarks · settings (profile + avatar upload).

**Course player** (`/dashboard/learn/[programSlug]`): enrollment-gated, immersive
full-width, curriculum sidebar (seasons, per-season %, green checks, current
highlight), privacy-friendly YouTube embed, prev/next + auto-advance, tabs
Overview / Resources / Q&A / Notes / Reviews, self-check quiz, optimistic
mark-complete rolling up to enrollment progress. Admins get an "Admin preview"
badge and see all statuses; students see `published` classes only.

**Commerce:** premium two-column `/checkout` (order summary · bKash card w/ copy
+ QR · verify-payment form w/ drag-drop screenshot ≤5MB · 7-step colored
How-to-Pay · need-help · trust strip). Free items grant instant access. The same
components are reused by the appointment payment page. **A student can never
approve their own payment.**

**Admin panel:** overview KPIs · Payment Requests (approve/reject → grants or
revokes access) · Payment Settings · Users (roles, protected against
self-demotion and removing the last admin) · Mentors (single-page editor: photo,
basic, contact + per-field visibility toggles, expertise/skills tags,
professional, availability, session & pricing, socials, status) · Programs
(3-column autosaving LMS editor: Program Info + Seasons tree + Class editor tabs
Basic/Overview/Resources/Quiz/Notes, drag-reorder, multi-mentor, Course Glimpse
as either a YouTube trailer or an uploaded photo, draft-class warning +
"publish all drafts") · Resources · Blog · Live Classes · Mock Tests ·
Questions · Reviews (moderate, filter, CSV export) · Appointments (KPIs, all
bookings w/ Manage dialog, calendar, mentor schedule editor, appointment types) ·
Settings (WhatsApp FAB + payment).

**Mentor panel:** overview · my programs · assigned questions · self-service
profile. Mentors are blocked from `/admin`.

**Cross-cutting:** admin-controlled floating WhatsApp button (global) ·
notification bell in the navbar for all roles with fan-out from payments,
questions, reviews and appointments · review system (lesson/season/course scopes,
completion-gated, admin-moderated, feeds homepage + program page + player) ·
SEO (sitemap, robots, dynamic OG image, per-page metadata) · security headers +
Report-Only CSP.

**Bilingual (EN/বাংলা):** the whole **public** surface is dubbed via the
`Bi = {en, bn}` + `<T>` client-leaf pattern. Dashboards, admin, mentor, auth,
checkout and the appointment wizard are **still English-only** — see §9.

---

## 5. Database & migrations

`supabase/migrations/` is the **single source of truth**. Apply **every file in
filename order** — `supabase db push`, or paste each into the Supabase SQL
editor. RLS is **ON for every table**. `supabase/schema.sql` + `policies.sql` are
historical reference only (fully reproduced by `000`).

After any migration, update `src/types/database.types.ts` **by hand** — that is
the project convention.

| # | File | What it does | Applied? |
|---|---|---|---|
| 000 | `base_schema` | core tables, RLS, helpers | ✅ |
| 001 | `public_mentor_profiles` | public read of mentor profiles | ✅ |
| 002 | `fix_is_admin_recursion` | `is_admin()` → SECURITY DEFINER | ✅ |
| 003 | `storage_buckets` | `payment-screenshots` (private), `avatars` (public) | ✅ |
| 004 | `resource_files_bucket` | `resource-files` (private) | ✅ |
| 005 | `mentor_access` | mentors read/answer assigned questions | ✅ |
| 006 | `security_hardening` | `public_*` views, column-guard triggers, storage limits | ✅ |
| 007 | `answers_insert_scope` | scope `answers` INSERT to the question | ✅ |
| 008 | `fk_ondelete_and_indexes` | FK behaviour + indexes | ✅ |
| 009 | `site_settings` | WhatsApp FAB config | ✅ |
| 010 | `lms` | seasons/classes/quizzes/resources/program_mentors + `course-assets` bucket | ✅ |
| 011 | `reviews` | `reviews` + `public_reviews` view | ✅ |
| 012 | `mentor_management` | mentor fields, locks base `mentors`, adds `public_mentors` view | ✅ |
| 013 | `appointments` | `appointment_types` (7 seeded), `appointments`, `notifications` | ✅ |
| 014 | `attempt_and_payment_integrity` | `test_attempts` read-only under RLS; appointment TrxID unique index | ⚠️ **unverified** |
| 015 | `publish_orphaned_draft_classes` | releases draft classes in already-sold, fully-dark courses | ⚠️ **unverified** |
| 016 | `program_preview_media` | `programs.preview_image_url` + `preview_kind` — enrol-card glimpse can be a photo instead of a trailer | ❌ **not applied** |

**Latest verified applied: `013`** (verified live 2026-07-22 via anon PostgREST
probes). **`014`, `015` and `016` have not been confirmed applied** — `016` is
brand new and definitely is not. Confirm before trusting anything that depends
on them. Until `016` is applied, the program editor's Course Glimpse toggle and
photo upload will fail to save ("Could not save the program"); every other field
is patched independently and keeps working, and the public page falls back to
exactly its old video-or-placeholder behaviour.

**Deploy-with-code migrations** (they close reads/writes the app used to rely on
and route them through `public_*` views or the service role): `006`, `012`, and
**`014`** — `submitAttempt` must be writing attempts with the service-role client
or every submission silently loses its history row.

---

## 6. Conventions — follow these

- **Supabase clients:** `server.ts` (RSC/actions, cookie-bound → forces dynamic
  rendering) · `browser.ts` (client components) · `admin.ts` (`server-only`,
  service role, admin-guarded) · `public.ts` (cookieless anon reads, lets a page
  stay static/ISR — use it for public catalogue pages).
- **Auth:** `proxy.ts` is the first gate; **pages re-check** with
  `requireAdmin()` / `requireMentor()`; **server actions re-verify role too.**
  Never rely on a single layer.
- **Server actions + zod** live in `src/features/<domain>/`. Validate on the
  server. Never trust a client-supplied price, score, or status.
- **URLs:** every field that reaches an `href` or an iframe `src` goes through
  `lib/safe-url.ts` (http/https only). Admin-authored HTML goes through
  `lib/sanitize-html.ts` **on write and on read**.
- **RSC → Client boundary:** never pass a function/component (e.g. a Lucide
  icon) from a Server Component to a Client Component. Pass a **string key** and
  resolve it inside the client component (see `appointment-icon.tsx`).
- **Design tokens** in `src/styles/globals.css` (`@theme`). Premium blue + cream
  light / deep navy dark. **Green (`#22C55E`) is status-only** — progress,
  success, completed, "secure/verified". Never a general accent. Feature cards,
  quiz badges and how-to-pay steps each get their **own** accent color. Only the
  navbar uses `.glass`. Corners 20–24px, 250–350ms transitions, spacing scale
  16/24/32/48/64, no large empty gaps between sections.
- **Mobile grids** always declare a base `grid-cols-1`.
- **Autosave editors** debounce, show "Saved / Last updated…", and still offer an
  explicit Save button. Don't `revalidate` on keystrokes.
- **Destructive confirms** use `components/shared/confirm-dialog.tsx`, never
  native `confirm()`/`prompt()`.
- **Error boundaries** use `unstable_retry()`, not `reset()` — `reset()` re-renders
  without re-fetching and cannot recover a Server Component error.
- **i18n:** `Bi = {en, bn}` pairs + `localize()` in `lib/i18n.ts`, rendered
  through the `<T en bn/>` client leaf so static pages stay static.
- **Everyday commands:**
  ```bash
  npm install
  npm run dev          # http://localhost:3000
  npm run check        # validate-env + lint + typecheck + test
  npm run build        # do this before any big commit
  ```

---

## 7. Gotchas — already paid for, do not rediscover

1. **RLS recursion:** `is_admin()` reads `profiles`, and profiles policies call
   `is_admin()` → infinite recursion unless the function is `SECURITY DEFINER`
   (migration 002). Any new policy that reads `profiles` must reuse `is_admin()`.
2. **RSC prop crash:** passing a function/icon to a Client Component throws
   "Functions cannot be passed to Client Components." This caused a full
   dashboard/admin login crash once.
3. **Mobile overflow:** a `grid` with only `lg:grid-cols-*` creates an implicit
   max-content column → horizontal scroll on phones. `body { overflow-x: clip }`
   is the guardrail, not the fix.
4. **Headless screenshots:** Chromium enforces a ~500px minimum window width, so
   a 390px screenshot *crops* a 500px layout and looks broken when it isn't.
   Verify responsive at **≥500px**.
5. **Framer entrance animations** starting at `opacity: 0` leave elements
   invisible when JS is slow or fails. The navbar uses a CSS `motion-safe`
   entrance and is visible by default — follow that pattern.
6. **Git Bash path conversion:** `/admin` as a CLI arg becomes `E:/GIT/Git/admin`.
   Prefix with `MSYS_NO_PATHCONV=1`.
7. **Partial unique indexes can't be inferred by `ON CONFLICT`** — the reviews
   submit path uses find-then-update/insert, not upsert. Don't "simplify" it.
8. **Two authoring paths can disagree on a column default.** `createClass`
   inserted `status='draft'` while the legacy form inherited the `published`
   default, so admins sold courses that students opened to "No lessons yet". It
   never reproduced for the admin, because admins preview every status. When you
   add a second writer for a table, check it against the first one's defaults.
9. **Supabase keys:** the project uses the legacy `anon` + `service_role` JWTs
   (still valid). `sb_publishable_` / `sb_secret_` keys also exist — don't mix.
10. **Next.js 16 is not your training data.** Read `node_modules/next/dist/docs/`.
11. **An admin list that reads the base table can't see the `public_*` view's
    filters.** `/admin/mentors` reads `mentors`; the whole public site reads
    `public_mentors`, which also demands `profiles.role = 'mentor'`. A mentor row
    hanging off an admin's or a student's profile is therefore visible *only* to
    the admin — the site looks broken with no error anywhere. **A user has exactly
    one role, so an admin cannot also be a public mentor**; a founder who mentors
    needs a separate mentor account. Whenever an admin screen reads a base table
    that has a `public_*` counterpart, mirror the view's WHERE clause and say why
    a row is hidden.

---

## 8. Health — verified 2026-07-27 at `0714773`

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| `npm run lint` | ✅ 0 errors (1 pre-existing warning: `<img>` in `opengraph-image.tsx`) |
| `npx vitest run` | ✅ 9 files / **80 tests** pass |
| `npm run build` | ✅ compiles in ~7s, 64 static pages generated |

Re-verified after the Course Glimpse change (2026-07-27, working tree).

**Rendering (from the build output):** static/ISR — `/` (5m), `/about`,
`/community` (10m), `/live-classes` (5m), `/contact`, legal pages, auth pages,
`/sitemap.xml`. SSG — `/blog/[slug]`. **Everything else is dynamic**, including
`/programs`, `/programs/[slug]`, `/mentors`, `/mentors/[id]`, `/resources`,
`/resources/[slug]`, `/blog`, `/mock-tests` — see §9.

> Note: a stale `node_modules` (missing `sanitize-html`) breaks typecheck and one
> test suite. `npm install` fixes it; the lockfile is correct.

---

## 9. Open work

Ordered by what actually matters. Everything here was re-verified against the
code on 2026-07-27 — this is the live list, not a wishlist.

### Blocking / operational

- **Apply migration `016`** (`program_preview_media`) — the Course Glimpse
  photo option cannot save until it exists.
- **Confirm migrations `014` + `015` are applied** to the Supabase project.
  `014` must ship together with its app code (`submitAttempt` service-role
  write). Until confirmed, `test_attempts` may still be self-writable and
  appointment TrxIDs replayable.
- **Configure mentor availability** (Admin → Appointments → Mentor Schedule) for
  at least one mentor, plus `session_duration` / `session_price_bdt`. Until then
  the booking wizard offers **no slots** and the whole appointment feature looks
  broken to a visitor.
- **Set the real bKash number** (Admin → Payment Settings — still placeholder).
- **Rotate the secrets shared during development:** Supabase `service_role` key
  and the DB password; update the new key in Vercel.
- **Set community links** — `NEXT_PUBLIC_COMMUNITY_FACEBOOK_URL` /
  `_WHATSAPP_URL` in Vercel (buttons stay hidden until set).
- **Re-enable email confirmation** in Supabase Auth if it was turned off for
  testing.
- **Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`** in Vercel. The
  rate limiter supports Upstash but **falls back to a per-instance in-memory Map**,
  which is a no-op across a serverless fleet — login, signup, password-reset,
  contact and payment limits are effectively unenforced without it.
- **Replace demo mentors / seed content** with real content.

### Product decisions

- **Bilingual is currently a half-promise (P1-9 / P1-10).** Measured coverage of
  files using `<T>` / `useLanguage` / `localize`:
  `(marketing)` 9/20 · `dashboard` **0/16** · `admin` **0/34** · `checkout`
  **0/2** · `appointments` **0/5** · `(auth)` **0/4** · `mentor` **0/8**.
  Also `title_bn`, `description_bn` and `name_bn` exist in the schema and types
  but are **referenced nowhere in application code** — every DB-driven string is
  English-only regardless of the toggle. And because the language lives in
  `localStorage`, the server always emits `<html lang="en">`, so **no Bengali
  page is indexable** and Bengali users get a flash of English on every
  navigation. Decide: either accept EN-only behind login, or commit to routed
  locales (`/bn/...`) + translated DB content. More `<T>` tags won't fix SEO.
- **Enforce the CSP.** `next.config.ts` ships `Content-Security-Policy-Report-Only`
  as the compensating control. Promote it to enforcing after one clean reporting
  cycle.
- **Hardcoded marketing metrics** — "5,000+ Students", "94% Success Rate",
  "25,000+ Questions Answered" are literals in `src/app/page.tsx` and
  `lib/constants.ts`. If they aren't defensible, they're a claims problem.

### Engineering debt

- **Public catalogue pages are uncached SSR.** `lib/supabase/public.ts` exists
  precisely so these can be prerendered, and `blog/[slug]`, `community` and
  `live-classes` were migrated — but `/programs`, `/programs/[slug]`, `/mentors`,
  `/mentors/[id]`, `/resources`, `/resources/[slug]`, `/blog`, `/mock-tests` and
  `/mock-tests/[slug]` still import the cookie-bound `server` client, and there
  is **no `generateStaticParams` outside `blog/[slug]`**. A Supabase round-trip
  on every acquisition-page hit.
- **Test coverage is unit-only.** 80 tests across 9 files, all pure functions
  (slots, sanitizer, safe-url, format, slug, youtube, site-url, two schema
  files). `vitest.config.ts` sets `include: ["src/**/*.test.ts"]` — `.tsx` is
  excluded, so component tests can't run without a config change. **Nothing
  covers** server actions, the payment approve/reject state machine, RLS
  policies, or auth flows, and there is no E2E suite. The highest-value untested
  code in the repo is `src/features/payments/admin-actions.ts`.
- **No vendor error monitoring.** `lib/observability.ts` is a deliberate seam
  that emits structured JSON to stderr and gives one call-site shape; adopting
  Sentry/OTel later is a change to that file only. Nothing is wired yet.
- **`submitManualPayment` doesn't check the amount against the real price** —
  only `> 0`. `approvePayment` *does* recompute the trusted total and refuse
  underpayment, so this is caught, but only by a human at review time.
  `updateAppointmentPayment` has no equivalent check at all.
- **Quiz answer keys ship to the browser** — the learn page selects
  `correct_answer` and `QuizPlayer` grades locally. Fine for a self-check widget;
  **not** acceptable if quizzes ever become assessed (mock tests correctly keep
  `correct_key` server-side).
- **`shadcn` CLI (v4.13.0) is in `dependencies`**, not `devDependencies`, so it
  ships to production installs. The `radix-ui` umbrella package is pulled in
  whole.
- **Node version drift:** `.nvmrc` = 22, `package.json engines` = `>=20.9.0`,
  CI = 22. The floor should match the tested version.
- **`deleteMentor`'s error message is stale** — it names programs, questions and
  live classes, but `appointments.mentor_id` is `ON DELETE RESTRICT` (migration
  013) and is now the most likely blocker.
- **Deferred features** (DB is future-proofed for all of these): SSLCommerz/Stripe
  auto-payments, certificate PDFs, mock-test leaderboards, realtime
  notifications, full community forum, voice/attachments in Ask-a-Mentor,
  bookmarks UI, set-password invite email for new mentors, PWA/analytics, deeper
  axe/Lighthouse pass.

---

## 10. Doc map — what each surviving file is for

| File | Role | Changes? |
|---|---|---|
| **`PROJECT_STATE.md`** (this file) | **Current state, open work, session log. Start here.** | Every session |
| `README.md` | Setup, env vars, how to apply migrations | When setup changes |
| `AGENTS.md` / `CLAUDE.md` | Agent directives (Next 16 warning + pointer here) | Rarely |
| `fully redesign the website/MCA_REDESIGN_MASTERPLAN.md` | Phase-2 redesign **spec**: design rules, gogee8 section inventory, the 9 chunk definitions. Its progress tracker now points here. | Only if scope changes |
| `fully redesign the website/convertion of the website MCS.md` | **Client spec** (primary) — WhatsApp button, LMS, mentor mgmt, appointments | Never (client input) |
| `fully redesign the website/*.jpg` | 6 UI reference screenshots the chunks were built against | Never |
| `docs/MCS main idea.md` | **Client spec** — brand identity & design language | Never |
| `docs/MCA Homepage Redesign Documentation .md` | **Client spec** — homepage + checkout | Never |
| `docs/01_MCA_Roadmap_MindMap.md` | Original MVP roadmap — historical | Never |
| `docs/02_MCA_Claude_Code_Prompts.md` | Original chunk prompts + MVP SQL — historical | Never |

**Deleted on 2026-07-27** (all superseded; content folded into §4–§9 above, full
detail preserved in git history): `docs/PROJECT_CONTEXT.md`, `docs/HANDOVER.md`,
`docs/PRODUCTION_READINESS_AUDIT.md`, `docs/PRODUCTION_AUDIT_2.md`,
`PRODUCTION_AUDIT_REPORTv2.md`, `PRODUCTION_READINESS_FINDINGS.md`.

---

## 11. Session log

Newest first. One entry per session that changed something. Keep entries short —
git commit messages carry the detail.

- **2026-07-30** — **Fixed "mentors exist but show nowhere."** Root cause was
  data, not code: `public_mentors` and `public_mentor_profiles` both require
  `profiles.role = 'mentor'`, and the DB had **3 admins, 10 students and zero
  mentors**. The single `mentors` row belonged to an *admin* account
  (`13fdc75d…`, MD Hujaifa Sarker) which is also the `mentor_id` on the programs,
  so `/mentors`, the homepage mentor section, program pages and the sitemap were
  all empty while Admin → Mentors happily listed one mentor. Promoted that
  account to `role='mentor'` (admins 3 → 2; the account **lost `/admin` access**,
  which the owner chose knowingly). Verified through the anon client and against
  the running app: `/`, `/mentors`, `/programs` and `/mentors/[id]` all render the
  mentor. Also fixed the reporting gap that hid this: `/admin/mentors` read the
  base table with no role check, so it could never disagree with the public site
  out loud. It now mirrors the view's WHERE clause and shows a per-row "Not
  public" badge with the reason plus a banner when *no* mentor is publicly
  visible. **Note for whoever owns content:** that mentor's `expertise` is one
  run-on tag ("Mindset Development Emotional Mastery Career Growth Strategy…")
  instead of separate tags, so it renders as a single long chip.
  This is gotcha #8's pattern again (see §7) — now generalised as #11 below.
- **2026-07-30** — Replaced the homepage hero photo
  (`public/images/hero-mentor-student.webp`) with a client-supplied image of a
  mentor guiding a student at a desk — closer to the mentorship-first promise in
  §1 than the previous generic two-students-at-a-laptop stock shot. The supplied
  file (`homepageMCS.webp` in the repo root) was **JPEG data under a `.webp`
  extension**, so it was re-encoded through `sharp` to real WebP (1254×1254,
  q82 → 92 KB, down from 188 KB) rather than copied. Hero alt text updated to
  describe the new photo. The hero card is `aspect-video` + `object-cover`, so a
  square source is centre-cropped to the middle 56% — verified the crop keeps
  both faces framed. The untracked root source file can be deleted. Verified:
  typecheck clean, lint 0 errors, build clean.
- **2026-07-27** — Program "Course Glimpse" can now be a **photo instead of a
  trailer**. Previously the enrol card on `/programs/[slug]` could only be
  filled by `preview_video_url`, so any course without a filmed trailer showed
  an empty gradient in the most valuable slot on the page. Migration `016` adds
  `preview_image_url` + `preview_kind` ('video'|'image'); the LMS editor gained
  a Video-link / Photo toggle (uploads to `course-assets/previews/`, same bucket
  as covers so `next/image` can load it), and the public page renders the chosen
  medium, falling back to the other one and then the placeholder. Storing an
  explicit kind — rather than "whichever is set" — means toggling never destroys
  the value you aren't currently showing. Also: the trailer field now warns
  inline when the link isn't a YouTube URL the embed helper can use.
  **Migration `016` is NOT yet applied.** Verified: typecheck, lint (0 errors),
  80 tests, build clean; dev smoke on the live DB — `/programs` 200, a detail
  page 200 rendering the placeholder path correctly *without* the new columns,
  admin editor 307→login, no runtime errors.
- **2026-07-27** — Docs consolidated. Created this file as the single state
  document; deleted six superseded state/audit docs (see §10); froze the
  masterplan's progress tracker to a pointer; corrected the README migration
  range to `000`–`015`. Re-verified the tree: `npm install` (node_modules was
  missing `sanitize-html`), typecheck clean, lint 0 errors, 80 tests pass, build
  clean. No application code changed.
- **2026-07-25** (`0714773`) — Fixed the delivery bug where published courses
  were invisible to buyers: `createClass` was inserting `status='draft'` while
  the player only reads `published`. New classes are created published, the
  editor warns on unpublished classes with a one-click "publish all drafts", and
  migration `015` releases classes stranded in already-sold, fully-dark courses.
  Also: course-player mobile ordering, and the empty state is no longer a dead
  end.
- **2026-07-25** (`bcb7648`) — UX + a11y: booking wizard step 3 had no
  programmatic labels at all; gender/occupation no longer pre-selected;
  accessible names for icon-only controls; 7 native `confirm()` dialogs replaced
  with the shared Dialog. All seven error boundaries migrated from `reset()` to
  `unstable_retry()`. E-book checkout no longer advertises live classes and a
  certificate. Sitemap gained legal + mock-test routes.
- **2026-07-25** (`7b137d9`) — Security: lesson HTML sanitized on write and read
  (closes the stored-XSS sink), central http(s)-only URL validation everywhere a
  value reaches an `href`, YouTube embed restricted to real YouTube hosts,
  Report-Only CSP. Appointments: past-slot rejection, `max_per_day` enforced
  server-side, duplicate TrxID handled, reschedule no longer demotes a confirmed
  booking, the two slot-reading actions now require auth and are rate-limited.
  Tests 44 → 80.
- **2026-07-25** (`8874c44`) — Production-readiness remediation: `test_attempts`
  read-only under RLS (migration `014`), migrations `000`/`001`/`002` stop
  recreating policies that later migrations drop, progress denominator filters
  `published`, silent admin write failures fixed, `setUserRole` protects the last
  admin, `discount_bdt` relabelled as the final price, three pages moved to the
  cookieless public client with ISR, optional Upstash rate-limit backend,
  observability seam.
- **2026-07-22** — Phase-2 redesign chunks **1–9 all completed** and migrations
  `009`–`013` applied and verified live: WhatsApp FAB + site settings, gogee8
  homepage sections + footer + mega menu, LMS data model + 3-column admin course
  editor, student course player, review system + moderation + social proof,
  single-page mentor management, end-to-end appointment booking, checkout
  componentisation, notification bell + fan-out + final QA. Then the entire
  public surface was dubbed to বাংলা with the `Bi`/`<T>` pattern.
- **Pre-2026-07-22** — MVP built and launched: all 17 original roadmap chunks,
  manual bKash commerce, admin/mentor/student panels, mock tests, Ask-a-Mentor,
  SEO/PWA-lite, RLS everywhere.
