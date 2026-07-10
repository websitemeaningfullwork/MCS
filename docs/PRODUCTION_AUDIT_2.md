# Production Readiness Audit — Round 2

Date: 2026-07-10
Scope: full-repo, evidence-backed re-audit after the first audit's P0–P3 remediation
(migration `006`, base-migration `000`, rate limiting, email, auth island, tests, etc.).
This round focuses on what **still** blocks a reliable production launch, with extra
attention to **UX**. Every finding below cites concrete repo/command evidence.

Verification run for this audit:
- `npm run check` (lint + `tsc --noEmit` + 25 vitest tests): **passing**.
- `npm run build`: **passing**; static routes now include `/contact`, `/register`,
  `/terms`, `/privacy`, `/refund`, `/forgot-password`, `/reset-password`.
- `git log`: latest work committed (`6af490c`).

Legend — **P0** launch blocker · **P1** high · **P2** medium · **P3** polish.
Confidence is **High** unless stated.

---

## A. Security

### S1 (P1) — `answers` INSERT is not scoped to the question
Evidence: `supabase/migrations/000_base_schema.sql:483`
```
create policy "answers: auth insert" on public.answers for insert
  with check (author_id = auth.uid());
```
The server action `src/features/questions/actions.ts:72` correctly checks `canAnswer`,
but RLS is the real boundary for direct anon-key API calls, and it only checks
`author_id = auth.uid()` — **not** whether the caller may see/participate in that
`question_id`.
Impact: any authenticated user can inject replies onto **any** question id
(including other users' private questions) via a direct Supabase call.
Fix: tighten the insert policy to require question access, e.g. `with check (author_id = auth.uid() and exists(select 1 from public.questions q where q.id = question_id and (q.student_id = auth.uid() or q.mentor_id = auth.uid() or q.visibility='community' or public.is_admin())))`. Ship as migration `007`.

### S2 (P1) — No HTTP security headers
Evidence: `next.config.ts` contains only an `images` block — no `async headers()`.
Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`
(clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`.
Impact: weaker defense against clickjacking, MIME sniffing, and XSS.
Fix: add a `headers()` function in `next.config.ts`. Start with a report-only CSP to
avoid breaking Supabase/YouTube/Google-fonts, then enforce.

### S3 (P2) — No duplicate-purchase guard
Evidence: `src/features/payments/actions.ts` — `submitManualPayment` creates a new
order + submission with no check for an existing `enrollments` / `resource_access`
row for that user+item (the `.from("enrollments")`/`.from("resource_access")` calls
at lines ~137/142 are only in `enrollFree`).
Impact: a user can pay twice for the same item; admins get confusing duplicate
requests; possible double-charge disputes.
Fix: before creating the order, reject if the user already owns the item.

### S4 (P2) — Committed operational identifiers in docs
Evidence: real admin email at `docs/HANDOVER.md:15` and `docs/PROJECT_CONTEXT.md:147`;
DB pooler host + db user at `docs/PROJECT_CONTEXT.md:131`.
Impact: if the repo is shared/public, this is a ready-made target list for
credential-stuffing / social engineering. (No secret *values* are committed —
verified — but identifiers are.)
Fix: replace with placeholders/secret-manager references; rotate the shared
`service_role` key + DB password before launch (already on the checklist).

### S5 (P2, external) — Email confirmation may be OFF in Supabase
Evidence: `docs/HANDOVER.md:85` and `docs/PROJECT_CONTEXT.md:203` both say to
"turn email confirmation back **on**". This is a Supabase dashboard setting and
cannot be verified from the repo.
Impact: if off, anyone can register unverified emails (spam/abuse).
Fix (your side): confirm it is ON in Supabase → Authentication before launch.

### S6 (P3) — In-memory rate limiter only
Evidence: `src/lib/rate-limit.ts` header comment. On Vercel's multi-instance runtime
it only throttles bursts hitting the same instance.
Fix: back it with Upstash Redis (or a Postgres counter) for a real cross-instance
guarantee.

---

## B. Missing / incomplete features

### F1 (P2) — Bookmarks: schema + RLS exist, no UI
Evidence: `bookmarks` table + `"bookmarks: own"` policy in `000_base_schema.sql`;
`grep -r Bookmark src` → **no matches**; `docs/PROJECT_CONTEXT.md:216` ("UI deferred").
Impact: a designed feature is invisible to users.
Fix: add a save button on cards + a `/dashboard/bookmarks` list, or remove the table
from scope until built.

### F2 (P2) — Live classes can't be assigned to a mentor/program
Evidence: `src/components/admin/live-class-form.tsx` only posts `title`,
`description`, `starts_at`, `meeting_url` (lines 19–43) — no `mentor_id`/`program_id`,
although both columns exist in `live_classes` (`000_base_schema.sql`).
Impact: mentor panel cannot show "my live classes"; classes aren't tied to programs.
Fix: add mentor + program selects to the form and persist them.

### F3 (P2) — Mentor onboarding has no invite email
Evidence: `docs/PROJECT_CONTEXT.md:160-161,212` — Admin → Mentors → New creates an
account with a random password; the mentor must use forgot-password.
Impact: clunky onboarding; mentors may never receive a way in.
Fix: send a set-password/invite email (now feasible — `src/lib/email.ts` exists).

### F4 (P1, UX) — Navbar "Search" is decorative
Evidence: `src/components/shared/navbar.tsx:176` — the search icon is
`<Link href="/programs">`. There is no site search.
Impact: users click a search affordance and get a category page — a broken mental
model on a content-heavy site.
Fix: implement real search (Supabase text filter / `ilike`) or remove the icon.

### F5 (P1, UX) — Language toggle doesn't translate content
Evidence: the EN/বাংলা toggle exists (`navbar.tsx`, `lang-toggle.tsx`), but
`grep -rl "useDict|dict\." src` returns only `navbar.tsx`, `footer.tsx`,
`language-provider.tsx` — **zero page/content files**. All page copy is hardcoded
English.
Impact: a prominent bilingual promise that does nothing for real content — misleading
for a Bangladesh-focused product.
Fix: either wire page copy through `lib/i18n.ts` (large) or scope the toggle down /
hide it until content is translated. Decide the product intent first.

### F6 (P2) — Mock tests: unlimited re-attempts, no timer
Evidence: `src/features/mock-tests/actions.ts` `submitAttempt` inserts a
`test_attempts` row unconditionally; the attempt page renders no countdown despite
`mock_tests.duration_minutes` existing.
Impact: no assessment integrity (mitigated today because only `is_free` tests are
attemptable).
Fix: enforce a single attempt (or track attempt count) and honor `duration_minutes`
when paid/graded tests arrive.

---

## C. UX

### U1 (P1) — No route-level loading UI beyond the root
Evidence: `find src/app -name loading.tsx` → only `src/app/loading.tsx`. The
`Skeleton` component (`src/components/ui/skeleton.tsx`) is **unused** anywhere in
`src/app`. Dashboard, admin, and marketing detail routes all fetch from Supabase
server-side with no segment `loading.tsx`.
Impact: slow, blank navigations on data-heavy pages; poor perceived performance.
Fix: add `loading.tsx` skeletons for `dashboard`, `admin`, and the marketing list/detail
segments.

### U2 (P1) — No pagination anywhere
Evidence: `src/app/(marketing)/mentors/page.tsx:22` and `blog/page.tsx:23` query with
**no limit** (load every row); `programs/page.tsx:39` and `resources/page.tsx:38` use
`.limit(60)` with **no "load more"** — silently truncating at 60.
Impact: content beyond 60 is invisible; list pages get slower and heavier as data
grows.
Fix: add real pagination (`.range()` + page controls) or infinite scroll; cap +
"view more".

### U3 (P2) — Inconsistent upload validation
Evidence:
- `src/components/checkout/checkout-form.tsx` validates type **and** 5 MB size before upload (good).
- `src/components/dashboard/settings-form.tsx:121` avatar input has only `accept="image/*"` — no size/type guard; the `avatars` bucket now allows only png/jpeg/webp ≤ 5 MB (migration 006), so a `.gif`/`.heic`/large file fails with a cryptic storage error.
- `src/components/admin/resource-form.tsx:178` file input has **no `accept`** at all; `resource-files` allows only pdf/epub/zip ≤ 25 MB.
Impact: confusing failures, no helpful messaging.
Fix: mirror the checkout-form validation (type + size + friendly toast) in the avatar
and resource uploads.

### U4 (P2) — Stale developer docs (maintainability/onboarding UX)
Evidence: `docs/HANDOVER.md` and `docs/PROJECT_CONTEXT.md` still describe
`src/middleware.ts` (now `src/proxy.ts`), migrations only up to `004`/`005` (now
`000`–`006`), and placeholder community links in `constants.ts` (now env-driven).
Impact: future devs/agents act on wrong information.
Fix: refresh both docs to match the current tree.

### U5 (P3) — Form a11y is now consistent, but not audited end-to-end
Evidence: auth/contact/checkout forms have `aria-invalid`/`aria-describedby`/
`role="alert"` (verified). No automated axe/Lighthouse pass exists.
Fix: run an axe + Lighthouse pass; fix contrast/focus/labels it surfaces.

---

## D. Performance

### Perf1 (P2) — Marketing data pages render dynamically
Evidence: `npm run build` marks `/programs`, `/mentors`, `/resources`, `/blog`,
`/live-classes`, `/mock-tests`, `/community` as `ƒ (Dynamic)`. They read cookies via
the server Supabase client, which opts them out of static/ISR. (The root-layout cause
was fixed last round; this is the per-page residual.)
Impact: every public list hits Supabase per request — slower TTFB, more DB load, less
CDN caching.
Fix: for public reads, use a cookie-less anon client (like `sitemap.ts` already does)
+ `export const revalidate = <seconds>` so these pages become ISR.

### Perf2 (P2) — Unbounded/large list reads
See **U2**. Same root cause; also a performance issue.

---

## E. Deployment / observability

### D1 (P1) — No CI pipeline
Evidence: `.github/workflows/` does **not exist**. Vercel only runs `next build`,
which passes even when lint/tests fail.
Impact: regressions (including the RLS/security kind) can ship undetected.
Fix: add a GitHub Actions workflow running `npm run check && npm run build` on PRs and
`main`.

### D2 (P2) — No error monitoring / analytics
Evidence: `package.json` has no Sentry/Datadog/LogRocket/PostHog/analytics dependency.
Server errors currently only `console.error` (e.g. `features/auth/actions.ts`).
Impact: production failures are invisible; no funnel/usage data.
Fix: add Sentry (or similar) for server + client errors; optionally privacy-friendly
analytics.

### D3 (P2) — `NEXT_PUBLIC_SITE_URL` validated at runtime only
Evidence: `src/lib/site-url.ts` logs and falls back in production if the value is
malformed, but nothing fails the build/`check`.
Impact: a misconfigured env silently ships localhost/wrong-origin links (OAuth,
password reset, sitemap).
Fix: add a `predeploy`/`check` assertion that required envs are present and valid.

---

## Fix plan (phased)

**Phase 1 — Security & correctness (do before real users/payments)**
1. Migration `007`: scope `answers` INSERT (S1) + `answers`/`questions` review.
2. Duplicate-purchase guard in `submitManualPayment` (S3).
3. Security headers in `next.config.ts` (S2).
4. CI workflow: `npm run check && npm run build` (D1).
5. Scrub identifiers from docs + confirm secret rotation (S4); confirm email
   confirmation ON in Supabase (S5).

**Phase 2 — UX & perceived quality**
6. `loading.tsx` skeletons for dashboard/admin/marketing (U1).
7. Pagination on mentors/blog/programs/resources (U2/Perf2).
8. Consistent upload validation for avatar + resource (U3).
9. Decide + act on the language toggle (F5/F4): implement or scope down.
10. Fix or remove the navbar search (F4).

**Phase 3 — Feature completion**
11. Live-class mentor/program assignment (F2).
12. Mentor invite email via `lib/email.ts` (F3).
13. Bookmarks UI or descope (F1).
14. Mock-test attempt limit + timer (F6).

**Phase 4 — Performance, observability, polish**
15. ISR for public marketing pages (Perf1).
16. Sentry + analytics (D2).
17. Env validation in `check` (D3); Redis-backed rate limit (S6).
18. axe + Lighthouse pass (U5); refresh docs (U4).

---

## What you need to do (your side — not code)

These require dashboard/account access I don't have:

1. **Rotate secrets** (before launch): Supabase `service_role` key and DB password
   (Settings → API / Database); update the new key in Vercel. — S4
2. **Confirm email confirmation is ON**: Supabase → Authentication → Providers/Email.
   — S5
3. **Set the real bKash number**: Admin → Payment Settings (still `01XXXXXXXXX` per
   docs). — launch content
4. **Provide real community links** (Facebook/WhatsApp) so I can set
   `NEXT_PUBLIC_COMMUNITY_FACEBOOK_URL` / `_WHATSAPP_URL` in Vercel. — F-content
5. **Confirm custom domain** (if any): add it to Vercel, to Supabase Auth redirect
   URLs, and to `NEXT_PUBLIC_SITE_URL`. — D3
6. **Decide the language strategy**: full Bangla translation vs. hide the toggle for
   now. This is a product call I need from you. — F5
7. **Create a Sentry (or chosen) project** and give me the DSN if you want error
   monitoring wired. — D2
8. **Provide/confirm real launch content**: replace demo mentors and seed data. —
   launch content
