# Production Readiness Audit — Report v2

**Project:** Meaningful Career Academy (MCA) — `mca-web`
**Stack:** Next.js 16.2.10 (App Router, RSC) · React 19.2.4 · Tailwind v4 · shadcn/Radix · Supabase (Postgres + Auth + Storage + RLS) · Vercel
**Audit date:** 2026-07-10
**Branch / HEAD:** `main` @ `89788ae`
**Method:** Full-repo audit across five parallel domains (security & authz, server actions & business logic, database & migrations, frontend/UX/a11y, build/deploy/tooling/tests). Every finding cites concrete file/line or command-output evidence. Highest-severity findings were independently re-verified by the report author.
**Scope note:** This report is an *evidence-backed re-audit* that supersedes `docs/PRODUCTION_AUDIT_2.md` and `docs/PRODUCTION_READINESS_AUDIT.md`. It reflects the **current** tree (migration `007`, CI workflow, security headers, `loading.tsx`, and pagination are all now present) and re-verifies which prior items are genuinely resolved vs. still open.

---

## 1. Executive summary

**Overall assessment: strong engineering, not yet launch-ready.** This is a disciplined, security-conscious codebase. The pipeline is fully green, the commerce path recomputes prices server-side, correct-answer keys are walled off, RLS is layered with column-protection triggers, and forms are exemplary. The blockers are a **small number of high-impact correctness bugs in the money/delivery path**, one **operational migration-idempotency trap that silently reverts security hardening**, and a set of medium polish/robustness gaps.

### Verdict by area

| Area | State | Blocker count |
|---|---|---|
| Build / typecheck / lint / tests | ✅ All green | 0 |
| Security & authorization | 🟢 Well-hardened; residual gaps | 0 critical, 2 high |
| Payments & delivery correctness | 🔴 Has silent-failure bugs | 2 high |
| Database & migrations | 🟠 One critical re-run trap | 1 critical |
| Frontend / UX / a11y | 🟢 High quality; one systemic gap | 0 critical, 1 high |
| Test coverage | 🔴 Business logic untested | 1 high |
| Observability / monitoring | 🔴 None | 1 high (launch) |

### Launch-blocking issues (P0/P1) at a glance

1. **[BIZ-1] Paid orders can silently deliver nothing** — `approvePayment` ignores every write error.
2. **[BIZ-2] Access can never be revoked** — `rejectPayment` has no approved-guard and no grant removal.
3. **[SEC-4 / BIZ-6] Paying students cannot download resource files** — download route reads the base table through RLS that now denies them.
4. **[DB-1] Re-running `000_base_schema.sql` reverts all of migrations 006 + 007** — silently re-opens four previously-closed P0/P1 holes.
5. **[SEC-1] Login open-redirect** via protocol-relative `?next=`.
6. **[UX-1] Bilingual (Bangla) toggle is non-functional** on 95%+ of content — a false product promise.
7. **[BLD-1] Business logic has near-zero test coverage** — payment/scoring/authz have no regression net.
8. **[BLD-2] No error monitoring / analytics** — production failures would be invisible (compounds BIZ-1/BIZ-4).

---

## 2. Verification results (commands actually run)

| Check | Command | Result | Evidence |
|---|---|---|---|
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | **PASS** | exit 0, no errors |
| Lint | `npm run lint` (eslint) | **PASS** | exit 0, no warnings/errors |
| Tests | `npm run test` (vitest run) | **PASS** | 5 files / 25 tests, 769 ms |
| Env validation | `node scripts/validate-env.mjs` | **PASS** | "no malformed environment variables detected" |
| Production build | `npm run build` | **PASS** | exit 0, 8.6 s, 54 routes generated |
| Dependency audit | `npm audit` | **2 moderate** | transitive `postcss` XSS via `next` |
| Git state | `git status` | Clean, up to date with `origin/main` | — |

**The app compiles, type-checks, lints, tests, and builds cleanly today.** No finding in this report is a build failure; they are correctness, security, coverage, and UX issues.

### Premises corrected during audit (previously suspected, found FALSE)
- `.env.local` is **not** git-tracked — `git ls-files | grep -i env` returns only `.env.example` and `scripts/validate-env.mjs`. `.gitignore` correctly ignores `.env.*` with `!.env.example`. Secret hygiene is correct. (The on-disk `.env.local` does hold a real `service_role` key — a normal local-dev situation; see SEC-6.)
- `tsconfig.tsbuildinfo` is **not** committed — ignored via `*.tsbuildinfo`.
- Node version is **consistent** — `.nvmrc`=22, `engines.node`=">=20.9.0", CI=node 22 (all agree).
- All "suspicious" dependency versions are **real published versions** (`next@16.2.10`, `react@19.2.4`, `zod@4.4.3`, `lucide-react@1.24.0`, etc.). `shadcn` in `dependencies` is correct (`globals.css` imports `shadcn/tailwind.css`).

### Prior-audit items now RESOLVED (verified in current tree)
- Security headers added to `next.config.ts` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). *(CSP still absent — SEC-3.)*
- CI workflow now exists (`.github/workflows/ci.yml` runs `npm run check` + build). *(Gaps remain — BLD-4.)*
- `answers` INSERT scoped to the question (migration `007`). *(But re-run trap — DB-1.)*
- Segment `loading.tsx` now present for marketing/admin/dashboard/mentor.
- Pagination implemented for mentors/blog/programs/resources.
- Live-class form now posts `mentor_id` / `program_id`.
- Duplicate-purchase guard now present in `submitManualPayment` (though racy — BIZ-3).

---

## 3. Findings by domain

Severity: **P0** = launch blocker / data-integrity or security critical · **P1** = high · **P2** = medium · **P3** = low/polish.

### 3.1 Payments, delivery & business logic

#### BIZ-1 (P0) — `approvePayment` swallows every write error → paid order can deliver nothing
**Evidence:** `src/features/payments/admin-actions.ts:86-117`. After the (excellent) trusted-total recomputation, the grant + finalize writes destructure no `error`:
```ts
await admin.from("enrollments").upsert({ ... });        // 89-94  — unchecked
await admin.from("resource_access").upsert({ ... });    // 96-102 — unchecked
await admin.from("orders").update({ status: "paid" });  // 105-108 — unchecked
await admin.from("manual_payment_submissions").update({ status: "approved" }); // 110-117 — unchecked
```
If any grant upsert fails transiently, the order is still flipped to `paid` and the submission to `approved`, and the function returns `{}` (success). The idempotency guard (`sub.status === "approved"` at line 37) then **blocks re-approval**, so there is no recovery path. The student paid, the admin sees "approved," and access was never granted.
**Fix:** Check `error` on each write and abort before advancing status; ideally wrap grant + status transition in a single Postgres RPC/transaction so status only advances after grants commit.

#### BIZ-2 (P0) — `rejectPayment` never revokes access and has no approved-guard
**Evidence:** `src/features/payments/admin-actions.ts:124-158`. It flips submission + order to `rejected` but there is **no code path anywhere** that deletes `enrollments` / `resource_access`, and no guard against `sub.status === "approved"`. An admin who approves (granting access) then rejects leaves the order `rejected` while the student keeps full access. Approve→reject→approve is likewise unguarded.
**Fix:** Guard `rejectPayment` against already-approved submissions, and on legitimate reject-after-approve explicitly revoke the grants.

#### BIZ-3 (P1) — Ownership check → order creation is a TOCTOU race (duplicate paid orders)
**Evidence:** `src/features/payments/actions.ts:60-76`. The "already owns this item" SELECT and the subsequent order creation are not atomic, and no unique constraint prevents multiple *pending* orders for the same `(user, item)`. Two concurrent checkouts (distinct TrxIDs) both pass and create two orders/submissions; an admin could approve both. Enrollment upsert is idempotent (no double-enroll) but produces duplicate review requests and a second "paid" order.
**Fix:** Partial unique index on active orders per `(user_id, item_type, item_id)`, or perform the check inside the transactional grant.

#### BIZ-4 (P1) — `submitManualPayment` does three non-atomic inserts → orphan orders
**Evidence:** `src/features/payments/actions.ts:105-133`. `orders` → `order_items` → `manual_payment_submissions` insert sequentially with no transaction. Migration 006 added a partial unique index `mps_transaction_id_active_uidx` on `transaction_id`; a resubmitted TrxID (double-click/retry) fails the *submission* insert with `23505`, but the already-committed `orders`/`order_items` rows are orphaned in `pending_verification` with no submission.
**Fix:** Create all three rows in one Postgres function/transaction, or pre-check the active TrxID and clean up on partial failure.

#### BIZ-5 (P1) — Widespread swallowed Supabase write errors (failures reported as success)
**Evidence:** Mutations destructure no `error` and return `{}`:
- `src/features/payments/actions.ts:155-165` (`enrollFree` — user redirected to dashboard with no access, no message, on failure)
- `src/features/learning/actions.ts:44-52, 81-88` (`lesson_progress` upsert, enrollment progress update)
- `src/features/admin/*-actions.ts` deletes: `deleteProgram:93`, `deleteBlogPost:84`, `deleteResource:81`, `deleteMockTest:78`, `deleteLiveClass:68`, `deleteMentor:130-131` (see DB-2 — this delete *does* fail in practice)
**Impact:** Users and admins see "success" while the write failed. **Fix:** Destructure and handle `error` consistently (log + typed error), matching the good pattern already in `saveProgram`/`saveBlogPost`.

#### BIZ-6 (P1) — Resource "draft/publish" workflow is unreachable from the admin UI
**Evidence:** Migration 006 added `resources.status` (`draft/published/archived`) and made `public_resources` filter `status='published'` (`006:104-121`). But `resourceSchema` has no `status` field and `saveResource` (`src/features/admin/resource-actions.ts:22-41`) never writes it → every resource defaults to `published` immediately, with no way to draft/unpublish. Note this interacts with **SEC-4/BIZ-7**: the download route requires `status='published'` semantics via the base table.
**Fix:** Add `status` to `resourceSchema` and persist it in `saveResource` (+ a publish toggle in the form).

#### BIZ-7 / SEC-4 (P1) — Paying students cannot download resource files (RLS fail-closed)
**Evidence:** `src/app/dashboard/resources/[id]/download/route.ts:37-41` reads `resources.file_storage_path` via the **user's RLS client** (`supabase`), *after* the ownership check passes. Migration 006 dropped `resources: public read` (`006:114`), leaving only `resources: admin write` (FOR ALL) on the base table (verified: `grep 'on public.resources' migrations/*` shows no student SELECT policy remains). So a non-admin student — even one with a valid `resource_access` row — gets zero rows and is redirected at line 42-43. **Paid downloads are broken for all non-admin users.**
**Fix:** Read `file_storage_path` via `createAdminClient()` (already instantiated at line 46) *after* the existing ownership/admin check.

#### BIZ-8 (P2) — Mock-test integrity is client-side only
**Evidence:** `src/features/mock-tests/actions.ts:26-85`. Scoring is correctly server-side and gated on `is_free`, but: the countdown/auto-submit lives only in `attempt-form.tsx:69-79` (a direct `submitAttempt` call bypasses the timer — `started_at`/`duration_minutes` are never persisted or checked); there is no attempt cap or rate limit (unlimited `test_attempts` rows); `answers: Record<string,string>` is **not Zod-validated** (unlike every other action); and the insert result (line 75) is unchecked. Also `mock_questions.marks` / `mock_tests.total_marks` are ignored — scoring is `+1` per question (latent bug if weighted questions arrive).
**Fix:** Persist attempt start server-side and reject late/duplicate submissions; add a Zod schema + size bound for `answers`; check the insert error; honor `marks`.

#### BIZ-9 (P2) — Payment approval never validates the amount the buyer claims to have paid
**Evidence:** `src/features/payments/admin-actions.ts:80-84` compares `trustedTotal` to `order.total_bdt` but never to `sub.paid_amount_bdt` (the amount the buyer entered; column `manual_payment_submissions.paid_amount_bdt`, `000:195`). An underpayment is approvable unless the admin eyeballs it.
**Fix:** Flag/reject when `sub.paid_amount_bdt < order.total_bdt`.

#### BIZ-10 (P3) — Minor logic notes
- `signInWithGoogle` leaks the raw provider error to the client (`src/features/auth/actions.ts:83`) — inconsistent with the generic-message pattern used everywhere else.
- `dashboard/questions/[id]/page.tsx:25-30,65` always renders "You asked"/"Add a follow-up" even for community questions owned by others (cosmetic authz-UX mismatch; no data leak).
- `parsePage` (`src/lib/pagination.ts:8-11`) has a lower clamp but no upper bound (negligible impact — Postgres returns an empty page).

**Verified correct (no action):** server-computed order totals + independent re-verification at approval; free-enroll re-checks `price>0` server-side; answer-key never exposed (public view omits `correct_key`); `postAnswer` authz exactly mirrors migration 007's RLS `with check`; screenshot path constrained to the caller's own folder and existence-verified; no N+1 (list pages batch with `.in()` + `Map`). No `TODO`/`FIXME`/`throw "not implemented"`/empty catch blocks anywhere in `src`.

---

### 3.2 Database & migrations

#### DB-1 (P0) — Re-running `000_base_schema.sql` silently REVERTS migrations 006 + 007
**Evidence:** `000_base_schema.sql:9-10` claims *"Fully idempotent: safe to run against a fresh project OR an already-migrated database."* But `000` unconditionally `drop … ; create …`s policies that later migrations deliberately removed/tightened (verified by grep):
- `000:425` recreates `resources: public read … using (true)` → re-exposes the base table incl. `file_storage_path` (006 dropped at `:114`).
- `000:499` recreates `mockq: read via test` → re-exposes `mock_questions.correct_key` publicly (006 dropped at `:83`).
- `000:367` recreates `profiles: public read mentors` → re-exposes mentor `email`/`phone` (006 dropped at `:95`).
- `000:440-463` recreate the student INSERT policies on `orders`/`order_items`/`manual_payment_submissions` → clients can craft self-priced orders again (006 dropped these).
- `000:483` recreates the weak `answers: auth insert` (`author_id = auth.uid()` only) → undoes 007's question-scoping.
**Impact:** A routine "re-apply the base schema" re-opens four P0/P1 holes with **no error** to signal it. The README ("safe to re-run") makes this a realistic operational trap.
**Fix:** Make `000` forward-only — do not recreate policies that later migrations supersede — or add an explicit "must always be followed by 006 and 007" gate. Correct the idempotency claim in the file header and README.

#### DB-2 (P1) — Missing `ON DELETE` on FKs into `profiles`/`mentors` blocks user/mentor deletion
**Evidence:** `000:206-207` (`questions.mentor_id`), `:218` (`answers.author_id`), `:278` (`blog_posts.author_id`), `:87` (`programs.mentor_id`), `:199` (`mps.reviewed_by`), `:224` (`live_classes.mentor_id`) declare **no `ON DELETE`** (defaults to `NO ACTION`/restrict). Deleting an `auth.users` row cascades to `profiles`, but that cascade is then *blocked* if the user authored any content or reviewed a payment. Concretely, `deleteMentor` (`src/features/admin/mentor-actions.ts:130`) ignores the returned error, so if the mentor owns any program/question/live-class the delete silently fails and the UI reports success (compounds BIZ-5).
**Fix:** Set `ON DELETE SET NULL` on those FKs (columns are already nullable), and check `.delete()` errors.

#### DB-3 (P2) — No `updated_at` auto-update trigger
**Evidence:** `updated_at timestamptz default now()` on `profiles/programs/orders/payment_settings` (`000:49,103,177,303`) fires only on INSERT; there is no `BEFORE UPDATE` trigger. App code sets it manually and inconsistently (e.g. `mentor-actions.ts:104` updates `profiles` without it).
**Fix:** Add a `moddatetime` trigger on those tables and drop the manual assignments.

#### DB-4 (P2) — Missing indexes on hot filtered/paginated columns
**Evidence:** No index for `orders(user_id)` (filtered in `dashboard/orders/page.tsx:17-21`), `blog_posts(status, published_at)` (paginated public listing), or `test_attempts(user_id)`. 006 added many hot-path indexes but skipped these three.
**Fix:** `create index on orders(user_id, created_at desc)`, `blog_posts(status, published_at desc)`, `test_attempts(user_id)`.

#### DB-5 (P3) — Smaller schema items
- **L1 redundant indexes:** `006:173-175` (`lesson_progress`, `resource_access`, `enrollments`) duplicate existing PK/UNIQUE indexes — pure write overhead; drop them.
- **`is_service_role()`** (`006:14-17`) lacks `set search_path = public` (diverges from the hardened `is_admin` pattern) and is missing from `database.types.ts` Functions.
- **`handle_new_user`** (`000:309-318`) inserts `new.email` into NOT-NULL `profiles.email`; a future phone/anonymous signup with null email would break signup. Add `coalesce`.
- **Storage:** `payment-screenshots` has no DELETE/UPDATE policy; `avatars` has no DELETE (`003`) — users can't replace/remove uploads (minor UX).
- **Doc drift:** `database.types.ts:9` and `seed.sql:2` reference deprecated `schema.sql`/`policies.sql`; types actually match the *migrated* DB (they include `resources.status` and the `public_*` views). Update the headers.

**Verified correct:** `schema.sql` ≡ `000` (only idempotency guards differ); money is `numeric(10,2)` with non-negative CHECKs (no float risk); every app-used enum/status value exists in DB constraints; slug/email/enrollment/resource-access uniqueness all enforced; migrations `001`–`007` are each individually idempotent (the only re-run hazard is DB-1's cross-migration ordering); seed FKs and enum values all resolve.

---

### 3.3 Security & authorization

> No **Critical** security issues. Migration 006/007 closed the highest-impact holes (self-promotion to admin, client-side order/price forging, answer-key exposure, mentor self-verify). Residual items below.

#### SEC-1 (P1) — Login open-redirect via protocol-relative URL
**Evidence:** `src/components/auth/login-form.tsx:36` — `router.push(next && next.startsWith("/") ? next : "/dashboard")`. `next` comes from `?next=` (attacker-controllable). `startsWith("/")` passes for `//evil.com` and `/\evil.com`, which `router.push` resolves as an external origin → post-login phishing redirect. `src/app/auth/callback/route.ts:11,17` has the same unvalidated `next` (mitigated only by the `origin` prefix quirk).
**Fix:** Accept only single-slash local paths, e.g. `/^\/(?!\/)/.test(next)`; apply in both places.

#### SEC-2 (P1) — Rate limiter is in-memory only (auth/payment throttles are bypassable)
**Evidence:** `src/lib/rate-limit.ts:13-14` (`const buckets = new Map()`). On Vercel's multi-instance runtime this throttles only same-instance bursts, weakening login brute-force (10/min, `auth/actions.ts:27`), signup, password-reset flooding, payment-submission spam, and contact spam. `clientIp()` (`:42-47`) also trusts the first `x-forwarded-for` token (spoofable).
**Fix:** Back the auth/payment paths with a shared store (Upstash Redis / Postgres counter); keep in-memory as best-effort.

#### SEC-3 (P2) — No Content-Security-Policy
**Evidence:** `next.config.ts:6-18` has a good baseline (HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) but **no CSP** (documented as deferred for YouTube/Supabase/Fonts embeds). The app renders user/admin markdown, so CSP is the main missing defense-in-depth layer.
**Fix:** Ship `Content-Security-Policy-Report-Only` first, then enforce. (XSS exposure is currently low — see "done well" — hence P2.)

#### SEC-5 (P3) — Narrow authorization gaps (low blast radius)
- **`test_attempts` self-reported score:** `000:504-507` `WITH CHECK` binds only `user_id`; a user can write `score=total` directly, bypassing server scoring. Harmless today (no reward tied to score) but becomes exploitable with leaderboards/certificates. Prefer writing attempts only via service role.
- **`createQuestion` trusts client `mentor_id`** (`questions/actions.ts:32`) — no validation it's a real/assigned mentor. Visibility forced to `private`, so small blast radius.
- **`mentor assigned update`** (`005:10-12`) has no narrowing `WITH CHECK`, so an assigned mentor could edit `student_id`/`title`/`body`/`visibility` (e.g. flip private→community), not just `status`.
- **`public_*` views** (`006:86-121`) run as definer (no `security_invoker=on`) — safe as written (column allow-list), but any future `ALTER VIEW` adding a sensitive column would silently expose it. Pin with a test/comment.

#### SEC-6 (operational, not a repo defect) — rotate the shared `service_role` key
The on-disk `.env.local` holds a live `service_role` JWT (full RLS bypass). It is **not** committed. If the working directory has ever been shared/backed-up/screen-shared, rotate it; ensure production sets it as an encrypted env var only.

**Verified done well:** admin self-promotion blocked by `protect_profiles_columns` trigger (`006:25-43`); `is_admin()` recursion solved with `SECURITY DEFINER` + `search_path` (`000:327-330`); commerce not forgeable client-side (student INSERT policies dropped, price re-verified at approval); every admin action guarded (`assertAdmin`/`getAdminId`) and every admin/mentor page calls `requireAdmin`/`requireMentor` using `auth.getUser()` (not spoofable `getSession()`); service-role client is `server-only` + `window` guard + no `NEXT_PUBLIC_`; XSS low-risk (`react-markdown` with no `rehype-raw`, no `dangerouslySetInnerHTML` anywhere, contact email HTML-escaped); proxy fails closed on missing env.

---

### 3.4 Frontend / UX / accessibility

#### UX-1 (P1) — Bilingual (Bangla) support is effectively non-functional
**Evidence:** `useDict`/`useLanguage` are consumed in only **3 files** (`navbar.tsx`, `footer.tsx`, `lang-toggle.tsx`) — verified independently. **0 of 65 page files are client components**, and the dictionary lives in a *client* React context (`language-provider.tsx`), so server-rendered pages architecturally cannot read it. All page/body copy is hardcoded English (e.g. `app/page.tsx:104,116,121`, `checkout/page.tsx:69,77`). The `common` dictionary section (`i18n.ts:66-74`) is dead code. A user selecting বাংলা sees ~10 nav/footer words change while 95%+ of the product stays English — the feature reads as broken, which is especially damaging for a Bangladesh-focused product.
**Fix (product decision required):** either (a) hide the toggle until content is translated, or (b) adopt a server-compatible i18n approach (`next-intl`, or pass `lang`/`dict` from server layouts) and expand the dictionary. The current client-context design can never cover server components.

#### UX-2 (P2) — Icon-only controls lack accessible names
**Evidence:** `src/components/admin/delete-button.tsx:59-68` — the trigger is a ghost `<Button>` containing only `<Trash2 />` with no `aria-label`/text; used on every admin list page. Screen readers announce a bare "button". Similarly `mentor-card.tsx:59` puts `aria-label` on a raw `<svg>` without `role="img"` (inconsistently announced).
**Fix:** Add `aria-label="Delete <item>"`; add `role="img"` (or an `sr-only` span) to meaningful icons.

#### UX-3 (P3) — Smaller UX/a11y/polish
- `<html lang="en">` is fixed server-side (`layout.tsx:51`), corrected only client-side — first paint & crawlers always see `en` (SEO/a11y gap; mostly moot until UX-1 is resolved).
- Remote Supabase avatars use plain `<img>` (`mentor-card.tsx:47`, `settings-form.tsx:117`) bypassing `next/image` (minor CLS/perf).
- `checkout/page.tsx:27` builds `next` with manual `%26` escaping instead of `encodeURIComponent` (fragile; correct pattern used at `mentors/[id]/page.tsx:76`).
- `empty-state.tsx:13` renders `<h3>` directly under an `<h1>` (heading-level skip).
- **Repo clutter:** `photos for website/` (3 source `.webp`, outside `public/`, unused) and leftover CRA SVGs in `public/` (`next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`) appear unused.
- **Upload validation inconsistency:** `checkout-form.tsx` validates type+size (good), but `settings-form.tsx:121` avatar input has only `accept="image/*"` and `resource-form.tsx:178` has no `accept` — mismatched uploads fail with cryptic storage errors given the 006 bucket MIME/size limits.

**Verified done well:** no dead links in navbar/footer/sidebars (every href resolves); forms disable on submit, show spinners, surface `toast.error`, and use `aria-invalid`/`aria-describedby`/`role="alert"` + `noValidate`; double-submit guarded (`attempt-form.tsx` `submittedRef`, disabled buttons); dynamic routes call `notFound()` and have `generateMetadata`; `sitemap.ts`/`robots.ts`/`opengraph-image.tsx` present; theme is hydration-safe (`useSyncExternalStore` + `suppressHydrationWarning`); no secrets in client components; skip-to-content link present.

---

### 3.5 Build, deploy, tooling & tests

#### BLD-1 (P1) — Near-zero test coverage of business logic
**Evidence:** Only 5 test files exist, all covering pure functions (`auth/schemas`, `payments/schemas`, `format`, `site-url`, `slug`). All **18 `use server` action modules are untested**, including the money path (`payments/actions`, `payments/admin-actions`), scoring (`mock-tests/actions`), and authz-scoped mutations (`questions/actions`). 205 `.ts/.tsx` source files vs 5 test files. `vitest.config.ts` globs only `src/**/*.test.ts` with `environment: "node"` — nothing exercises actions or RLS.
**Impact:** The highest-risk logic (exactly the code with the BIZ-1/BIZ-2 bugs) has no regression net.
**Fix:** Unit-test scoring and the payment state machine (extract pure helpers); add an integration suite against a Supabase test project asserting RLS denies cross-tenant access; wire `vitest run --coverage` with a floor into CI.

#### BLD-2 (P1, launch) — No error monitoring or analytics
**Evidence:** `package.json` has no Sentry/Datadog/PostHog/analytics dependency; server errors only `console.error`. Combined with the swallowed-error bugs (BIZ-1/BIZ-4/BIZ-5), a silent non-delivery after payment would be **completely invisible** in production.
**Fix:** Add Sentry (server + client) before launch; optionally privacy-friendly analytics.

#### BLD-3 (P2) — Known transitive vulnerability: PostCSS XSS via Next
**Evidence:** `npm audit` → `postcss <8.5.10` (GHSA-qx2v-qp2m-jg93, moderate) pulled via `next`. `npm audit fix --force` would downgrade to `next@9.3.3` (unacceptable).
**Fix:** Do **not** run `--force`. Add an npm `overrides` block (`"overrides": { "postcss": ">=8.5.10" }`) and re-audit, or wait for the Next patch. Track the advisory.

#### BLD-4 (P2) — CI is verify-only; no deploy/caching/concurrency
**Evidence:** `.github/workflows/ci.yml` runs `npm run check` + `npm run build` only. No `.next/cache` caching, no `concurrency:` to cancel superseded runs, no deploy job (deploy is presumably Vercel-side, unverified by CI).
**Fix:** Add `concurrency: { group: ${{ github.ref }}, cancel-in-progress: true }`, `actions/cache` for `.next/cache`, and either a deploy job or a doc note that Vercel owns deploy.

#### BLD-5 (P2) — Env validation does not enforce presence
**Evidence:** `scripts/validate-env.mjs` only fails on *present-but-malformed* `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_SUPABASE_URL`; it does not require any var to exist. A deploy missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` would pass `check` and fail at runtime.
**Fix:** Assert required vars are present (at least in a `predeploy`/CI step).

#### BLD-6 (P3) — Tooling/doc cleanup
- **README migration list stale:** `README.md:64` says "`000` → `006`"; migration `007` exists and would be skipped by a verbatim fresh deploy — leaving Ask-a-Mentor authz misconfigured. Update to `000` → `007`.
- **`pg` is an unused devDependency** (`package.json`) — no `from "pg"`/`require("pg")` anywhere and no `migrate` script. Remove, or restore the runner it was for.
- **Prettier configured but unused** — `prettier` + `prettier-plugin-tailwindcss` in devDeps, but no `.prettierrc` and no `format` script; CI never runs it. Add config + `format:check`, or drop the deps.
- **Bundle sizes not reported** — Next 16 Turbopack build table omits per-route JS size; add `@next/bundle-analyzer` if budgets matter.

---

### 3.6 Performance

- **PERF-1 (P2):** Public marketing list pages render dynamically (`ƒ`) because they read cookies via the server Supabase client, opting out of ISR/CDN caching — every public list hits Supabase per request. `sitemap.ts` already shows the cookie-less anon-client pattern; apply it + `export const revalidate` to `/programs`, `/mentors`, `/resources`, `/blog`, `/live-classes`, `/mock-tests`, `/community`.
- **PERF-2 (P2):** Missing indexes (DB-4) will cause sequential scans on `orders`/`blog_posts`/`test_attempts` as data grows.
- Note: N+1 was specifically checked and **not** found — list pages batch related lookups with `.in()` + `Map`.

---

## 4. Prioritized fix plan

### Phase 0 — Correctness & data integrity (before any real payments)
1. **BIZ-1** — check every write in `approvePayment`; only advance status after grants commit (transaction/RPC).
2. **BIZ-2** — guard `rejectPayment` against approved submissions; revoke grants on reject-after-approve.
3. **BIZ-7/SEC-4** — fix resource download to read `file_storage_path` via the admin client (paid downloads are currently broken).
4. **DB-1** — make `000` forward-only (stop recreating superseded policies); fix the "safe to re-run" claim in file header + README.
5. **BIZ-5 / DB-2** — handle write errors in `enrollFree`, learning progress, and all admin deletes; add `ON DELETE SET NULL` FKs so deletes actually work.

### Phase 1 — Security & launch safety
6. **SEC-1** — reject protocol-relative `next` in login + auth callback.
7. **SEC-2** — distributed rate limiting for auth/payment paths.
8. **BLD-2** — wire Sentry (server + client) before launch.
9. **BLD-5** — enforce required-env presence in `check`/predeploy.
10. **BIZ-3 / BIZ-4** — make checkout inserts atomic; add active-order uniqueness.

### Phase 2 — Robustness, coverage & correctness gaps
11. **BLD-1** — tests for scoring + payment state machine; RLS integration suite; coverage in CI.
12. **BIZ-6** — add `status` to resource schema/form (publish workflow).
13. **BIZ-8** — server-side mock-test timing/attempt caps + Zod-validate `answers`.
14. **BIZ-9** — validate `paid_amount_bdt` at approval.
15. **DB-3 / DB-4** — `updated_at` trigger + missing indexes; drop redundant indexes.
16. **BLD-3** — `postcss` override; **BLD-4** — CI concurrency/cache.

### Phase 3 — UX, performance & polish
17. **UX-1** — decide the i18n strategy (hide toggle or adopt server i18n).
18. **UX-2 / UX-3** — a11y labels, upload validation parity, avatar `next/image`, heading levels, repo cleanup.
19. **PERF-1** — ISR for public marketing pages.
20. **SEC-3** — CSP (report-only → enforce); **SEC-5** — narrow the residual authz gaps; **BLD-6** — README/tooling cleanup.

---

## 5. Owner action items (dashboard/account side — not code)
These can't be verified or fixed from the repo:
1. **Rotate the shared `service_role` key + DB password** if the dir was ever shared; set them as encrypted env vars in Vercel (SEC-6).
2. **Confirm email confirmation is ON** in Supabase → Authentication (prior docs note it may have been turned off for testing).
3. **Set the real bKash number** in Admin → Payment Settings (placeholder `01XXXXXXXXX`).
4. **Provide real community links** (`NEXT_PUBLIC_COMMUNITY_FACEBOOK_URL` / `_WHATSAPP_URL`).
5. **Confirm custom domain** in Vercel + Supabase Auth redirect URLs + `NEXT_PUBLIC_SITE_URL`.
6. **Decide the language strategy** (drives UX-1).
7. **Create a Sentry project** and supply the DSN (BLD-2).
8. **Replace demo/seed content** with real launch content.

---

## 6. Confidence & method notes
- Findings labeled from direct file/line reads or captured command output. The report author independently re-verified the P0/P1 items: `approvePayment`/`rejectPayment` (admin-actions.ts:86-158), the download route + remaining `resources` RLS policies, and the `000` policy-recreation lines (367/425/483/499) against 006/007.
- No application files were modified during this audit — only this report was created.
- Where a prior audit claim proved false against the current tree (committed env/tsbuildinfo, node-version mismatch, "fake" package versions), it is explicitly corrected in §2.
