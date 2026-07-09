# Production Readiness Audit

Date: 2026-07-10
Scope: full repository read-only audit of the Next.js 16, Supabase, and Vercel-oriented MCA app. The only intended codebase change from this audit is this markdown file.

## Verification Summary

- `npm run lint`: failed with 5 React/ESLint errors.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run build`: initially failed in the sandbox with Windows `EPERM` while unlinking `.next/app-path-routes-manifest.json`; rerun outside the sandbox and passed.
- Production build warning: Next.js 16.2.10 reports `"middleware" file convention is deprecated. Please use "proxy" instead.`
- `npm ls --depth=0`: dependency tree resolves with Next 16.2.10 and React 19.2.4.
- `git status --short`: clean before writing this report.

## Fix Order

1. Fix P0 security issues before any public launch.
2. Fix lint and add a real CI `check` gate so Vercel cannot deploy code that only passes `next build`.
3. Make Supabase schema and migrations reproducible from a clean project.
4. Add route error/loading boundaries and production smoke tests.
5. Finish launch content, SEO, performance, accessibility, and operational hardening.

## P0 Blockers

### 1. Authenticated users can self-promote to admin through RLS

Files:
- `supabase/policies.sql:37-38`
- `supabase/schema.sql:21-31`
- `src/features/profile/actions.ts:39-42`

Problem:
`profiles` stores the `role` column, and the RLS policy allows a user to update their own `profiles` row. The app's `updateProfile` action only updates safe profile fields, but direct Supabase API calls can update any writable column allowed by table privileges, including `role`.

Impact:
Any authenticated user can potentially set `role = 'admin'`, gaining access to admin-only pages, server actions, and privileged workflows.

Fix guidance:
- Remove broad user update access to `public.profiles`.
- Add a `security definer` RPC or server-only action for profile edits that updates only `full_name`, `bio`, `avatar_url`, and other safe fields.
- Add a trigger that rejects non-admin changes to `role`, `email`, `created_at`, and system fields.
- Add a regression test that signs in as a student and verifies direct Supabase update of `profiles.role` is rejected.

### 2. Mentors can alter trust and ranking fields through RLS

Files:
- `supabase/migrations/005_mentor_access.sql:24-27`
- `supabase/schema.sql:35-47`
- `src/features/mentor/actions.ts:39-48`

Problem:
The mentor self-update policy allows a mentor to update their own `mentors` row. That row includes admin-controlled fields such as `rating`, `reviews_count`, `is_verified`, and `is_featured`. The UI action updates only profile text fields, but direct API calls are broader.

Impact:
A mentor can self-verify, feature themselves, or manipulate ratings.

Fix guidance:
- Replace direct table update permission with a restricted RPC for mentor self-service fields.
- Protect `rating`, `reviews_count`, `is_verified`, `is_featured`, and any future ranking/trust fields with admin-only updates.
- Add a trigger that blocks non-admin updates to protected mentor columns.
- Add RLS tests for mentor self-update attempts on protected fields.

### 3. Commerce approval trusts client-writable order data

Files:
- `supabase/policies.sql:95-118`
- `src/features/payments/actions.ts:52-81`
- `src/features/payments/admin-actions.ts:30-75`
- `src/app/admin/payments/[id]/page.tsx:29-43`

Problem:
Students can insert their own `orders`, `order_items`, and manual payment submissions. The normal server action creates a clean order, but direct Supabase API access can craft or mutate order items. Admin approval then reads `order_items` and grants access without recomputing item validity, price, ownership, or payment amount from trusted tables.

Impact:
A user can craft an order for paid content or alter item rows, submit a manual payment, and rely on admin approval to unlock access.

Fix guidance:
- Remove direct student insert policies for `orders`, `order_items`, and sensitive submission relationships.
- Create checkout through a server-only transaction or `security definer` RPC.
- In approval, re-read the order by `order_id + user_id`, verify status is `pending_verification`, recompute total from trusted `programs/resources`, compare against `orders.total_bdt` and `manual_payment_submissions.paid_amount_bdt`, and reject mismatches.
- Enforce `manual_payment_submissions.order_id` belongs to `auth.uid()` at the database layer.
- Add transactional behavior so access grants, order status, and submission status cannot partially apply.

### 4. Mock-test answer keys are publicly readable

Files:
- `supabase/schema.sql:242-250`
- `supabase/policies.sql:141-148`
- `src/app/(marketing)/mock-tests/[slug]/attempt/page.tsx:30-35`
- `src/features/mock-tests/actions.ts:35-58`

Problem:
The attempt page intentionally avoids selecting `correct_key`, but RLS permits public reads of `mock_questions`, and `correct_key` lives in that same table. Anyone with the anon key can query answers directly.

Impact:
Mock tests can be cheated before submission. Paid or assessment-grade tests are not trustworthy.

Fix guidance:
- Restrict base `mock_questions` table to admin/service role.
- Expose a public view or RPC with only `id`, `question`, `options`, and `sort_order`.
- Keep answer keys in an admin-only table or protect them with stricter policies.
- Score attempts through a server-only path that can read answer keys.
- Enforce `mock_tests.is_free` or paid access before rendering attempts and inside `submitAttempt`.

## P1 High Priority

### 5. Public profile and resource policies expose private fields

Files:
- `supabase/policies.sql:31-38`
- `supabase/policies.sql:84-87`
- `supabase/schema.sql:21-31`
- `supabase/schema.sql:132-149`
- `src/app/(marketing)/resources/page.tsx:30`
- `src/app/(marketing)/resources/[slug]/page.tsx:16-18`

Problem:
RLS is row-level, not column-level. Public mentor profile reads can expose full mentor profile rows, including email and phone. Public resource reads expose the full `resources` row, including `file_storage_path`, and resources have no publish/status gate.

Impact:
Private contact fields, private storage paths, paid resource metadata, or draft resources can leak through direct API calls.

Fix guidance:
- Create `public_mentor_profiles` and `public_resources` views with only safe columns.
- Revoke broad direct table reads where possible.
- Add `resources.status` and/or `published_at`.
- Make public pages query the safe views or select only safe columns.
- Keep `file_storage_path` visible only to admin/server download flows.

### 6. Payment screenshot path is trusted from the client

Files:
- `src/features/payments/schemas.ts:14`
- `src/features/payments/actions.ts:71-80`
- `src/app/admin/payments/[id]/page.tsx:45-52`
- `src/components/checkout/checkout-form.tsx:46-58`

Problem:
The client uploads a screenshot, then sends `screenshot_path` as an arbitrary string. The server stores it and the admin page signs it with the service-role client.

Impact:
Admins can be shown a client-supplied path that was never tied to the authenticated user or order.

Fix guidance:
- Validate that `screenshot_path` starts with `${user.id}/`.
- Verify the object exists in `payment-screenshots` before storing it.
- Prefer server-generated upload paths tied to `order.id` or a submission id.
- Reject paths containing traversal-like or cross-user prefixes.

### 7. Storage buckets have no production file limits

Files:
- `supabase/migrations/003_storage_buckets.sql:6-12`
- `supabase/migrations/004_resource_files_bucket.sql:4-6`
- `src/components/checkout/checkout-form.tsx:121-124`
- `src/components/admin/resource-form.tsx:178`
- `src/components/dashboard/settings-form.tsx:50-59`

Problem:
Buckets are created without file size limits or MIME allowlists. Client `accept` attributes are only UI hints and do not enforce security.

Impact:
Users or admins can upload oversized or unexpected files, increasing cost and risk.

Fix guidance:
- Set `file_size_limit` and `allowed_mime_types` on `payment-screenshots`, `avatars`, and `resource-files`.
- Validate file type and size client-side and server-side.
- Use separate limits for avatars, screenshots, and resource PDFs.
- Add storage policy tests for wrong bucket, wrong folder, wrong MIME, and oversized upload.

### 8. Supabase migrations are not reproducible from a clean environment

Files:
- `README.md:61-64`
- `docs/HANDOVER.md:63-72`
- `docs/PROJECT_CONTEXT.md:110-120`
- `supabase/schema.sql`
- `supabase/policies.sql`
- `supabase/migrations/001_public_mentor_profiles.sql`
- `supabase/migrations/005_mentor_access.sql`

Problem:
The base schema and base policies live in standalone SQL files, while later policy and storage changes live in migrations. A fresh Supabase project following README misses later migrations; a project using only `supabase/migrations` cannot create the base schema.

Impact:
New environments, restores, and production parity will drift or fail.

Fix guidance:
- Convert the full schema, policies, storage buckets, and current policy patches into ordered migrations.
- Make `supabase/migrations` the single source of truth.
- Update README/HANDOVER with one exact setup command/order.
- Add a restore drill: create a fresh database from migrations and run smoke checks.

### 9. Lint fails and is not enforced by build

Files:
- `src/app/(marketing)/live-classes/page.tsx:65`
- `src/components/checkout/checkout-form.tsx:49`
- `src/components/marketing/category-icon.tsx:47-48`
- `src/components/shared/language-provider.tsx:33-38`
- `src/components/shared/theme-toggle.tsx:13`
- `package.json:5-10`

Problem:
`npm run lint` fails with 5 errors. `next build` still passed, so a deployment can succeed unless CI explicitly runs lint.

Fix guidance:
- Resolve the React rules violations.
- Add `typecheck` and `check` scripts, for example `check = npm run lint && npm run typecheck`.
- Run `npm run check && npm run build` in CI/Vercel.
- Consider failing PRs on warnings once the current errors are fixed.

### 10. Next 16 middleware convention is deprecated

Files:
- `src/middleware.ts:13`
- `src/middleware.ts:16-20`
- `next.config.ts:1-5`

Problem:
The project uses Next 16.2.10. Local Next docs and `next build` warn that the `middleware` convention is deprecated and renamed to `proxy`. The current middleware also passes through all requests when Supabase env vars are missing.

Impact:
Future upgrade risk, noisy production builds, and a fail-open first gate if env vars are misconfigured.

Fix guidance:
- Rename to `src/proxy.ts`.
- Rename exported function from `middleware` to `proxy`.
- Keep page/action auth checks as the real security boundary.
- Fail closed for protected routes if required Supabase env is missing.
- Narrow matcher if possible to protected/auth-sensitive routes.

### 11. Root layout makes public routes dynamic and Supabase-dependent

Files:
- `src/app/layout.tsx:51-64`
- `src/components/shared/navbar.tsx`
- `src/components/shared/footer.tsx:1`

Problem:
The root layout fetches Supabase user/profile data for every route just to render auth-aware navigation. The production build shows almost all routes as dynamic.

Impact:
Public marketing pages inherit auth/session latency, database failure risk, less static caching, and more server work.

Fix guidance:
- Move auth/profile lookup to protected layouts where possible.
- Split navbar auth controls into a small dynamic island.
- Keep public marketing content static or ISR-friendly.
- Make footer server-rendered if language support can come from a cookie/server prop.

### 12. No route-level loading or error boundaries

Files:
- No `src/app/loading.tsx`
- No `src/app/error.tsx`
- No `src/app/global-error.tsx`
- No segment-level `loading.tsx` or `error.tsx`

Problem:
Data-heavy pages call Supabase directly but have no route loading UI or segment error UI.

Impact:
Users see generic production failures and weak pending-navigation feedback.

Fix guidance:
- Add root `loading.tsx`, `error.tsx`, and `global-error.tsx`.
- Add focused boundaries for `dashboard`, `admin`, `checkout`, and marketing detail routes.
- Make error UI avoid leaking server details.
- Add logging hooks for server errors.

## P2 Medium Priority

### 13. Missing constraints and indexes for data integrity and scale

Files:
- `supabase/schema.sql:151-158`
- `supabase/schema.sql:178-191`
- `supabase/schema.sql:195-212`
- `supabase/schema.sql:242-260`

Problems:
- `resource_access.order_id` has no foreign key.
- `manual_payment_submissions.transaction_id` is not unique or scoped.
- Many high-use FK/filter columns lack explicit indexes.

Impact:
Orphan rows, duplicate payment submissions, slow dashboard/admin list pages, and slow RLS checks as data grows.

Fix guidance:
- Add FK from `resource_access.order_id` to `orders(id)`.
- Add a unique or review-status-aware constraint for payment transaction IDs.
- Add indexes for `order_items(order_id)`, `manual_payment_submissions(user_id,status,order_id)`, `questions(student_id,status,mentor_id)`, `answers(question_id)`, `mock_questions(mock_test_id)`, `lesson_progress(user_id,lesson_id)`, and other list/filter paths.
- Add check constraints for non-negative prices, discounts, ratings, and counts.

### 14. Server actions rely on UI/RLS instead of explicit authorization in several places

Files:
- `src/features/questions/actions.ts:43-79`
- `src/features/questions/actions.ts:81-99`
- `src/features/learning/actions.ts:6-34`
- `supabase/policies.sql:121-133`

Problems:
- `postAnswer` checks login but not whether the caller owns, can view, or is assigned to the question before inserting.
- `closeQuestion` checks login and then updates by id; RLS currently limits updates, but the action itself does not express the rule.
- `markLessonComplete` verifies enrollment in a program but does not verify `lessonId` belongs to that program before writing progress.

Impact:
Security depends on database policies and can silently fail or become vulnerable if policies drift.

Fix guidance:
- Add explicit ownership/role checks inside each server action.
- Mirror those rules in RLS.
- Return clear errors when authorization fails.
- Validate IDs with zod before database calls.

### 15. Admin and mentor actions often ignore database errors

Files:
- `src/features/admin/users-actions.ts:35-37`
- `src/features/admin/users-actions.ts:51-54`
- `src/features/admin/program-actions.ts:90-95`
- `src/features/admin/program-actions.ts:110-113`
- `src/features/admin/resource-actions.ts:78-83`
- `src/features/admin/live-class-actions.ts:61-66`
- `src/features/admin/blog-actions.ts:81-87`
- `src/features/mentor/actions.ts:30-38`

Problem:
Several writes/delete/upserts do not inspect `{ error }`.

Impact:
UI can report success and revalidate even when the database rejected the operation.

Fix guidance:
- Capture and handle every Supabase mutation result.
- Return user-safe errors.
- Add operation logging for admin actions.
- Avoid continuing multi-step workflows after a failed earlier mutation.

### 16. Runtime and package manager versions are not pinned

Files:
- `package.json:1-10`
- no `.nvmrc`
- no `.node-version`

Problem:
No `engines`, `packageManager`, `.nvmrc`, or `.node-version` exists. Local Node observed by subagent was v25.6.1, while `@types/node` targets Node 20.

Impact:
Local, CI, and Vercel can run different Node/npm behavior.

Fix guidance:
- Pin a supported production Node line, such as Node 22 or a Next-supported Node 20.9+ line.
- Add `engines.node`.
- Add `packageManager` with the npm version used to generate the lockfile.
- Add `.nvmrc` or `.node-version`.

### 17. No automated test strategy

Files:
- `package.json:5-10`
- no test config files found

Problem:
No test script, test runner, or smoke-test suite exists.

Impact:
Payments, auth guards, storage permissions, RLS behavior, mentor/admin flows, and downloads are regression-prone.

Fix guidance:
- Add Playwright smoke tests for public pages, login/register, protected redirects, checkout, admin approval, mentor question flow, mock test attempt, and resource download.
- Add database/RLS tests using Supabase local or SQL assertions.
- Add unit tests for pricing, slugging, and form schemas.

### 18. Redirect helpers can throw if site URL env is missing or malformed

Files:
- `src/app/dashboard/resources/[id]/download/route.ts:19-21`
- `src/app/dashboard/resources/[id]/download/route.ts:35-59`
- `src/features/auth/actions.ts:16-18`
- `src/app/sitemap.ts:4`
- `src/app/layout.tsx:26-29`

Problem:
Several flows build URLs from `NEXT_PUBLIC_SITE_URL`, with localhost fallback in some places and no request-origin fallback in route handlers.

Impact:
Wrong production URL can break OAuth, password reset, sitemap, metadata, and resource-download redirects.

Fix guidance:
- Centralize URL construction.
- Validate `NEXT_PUBLIC_SITE_URL` during startup/check scripts.
- In route handlers, prefer `new URL(path, request.url)` for same-origin redirects.
- Ensure Vercel production and preview envs use correct URLs.

### 19. Operational credentials and sensitive setup notes are committed in docs

Files:
- `docs/PROJECT_CONTEXT.md:145-157`
- `docs/PROJECT_CONTEXT.md:121-141`
- `docs/HANDOVER.md:77-87`

Problem:
Committed docs include operational account references, password/credential notes, Supabase project details, and explicit rotation reminders. This report intentionally does not repeat the secret values.

Impact:
If the GitHub repo is public or broadly shared, these details increase takeover and social-engineering risk.

Fix guidance:
- Rotate all development/shared credentials before launch.
- Remove actual passwords and sensitive connection details from committed docs.
- Replace with secret-manager references and runbook steps.
- Audit git history if real secrets were ever committed.

### 20. Public contact/auth/payment surfaces lack abuse controls

Files:
- `src/features/contact/actions.ts:6-29`
- `src/features/contact/schemas.ts:3-8`
- `src/features/auth/actions.ts:20-88`
- `src/features/payments/actions.ts:34-83`

Problems:
- Contact form has validation but no rate limit and no max lengths beyond minimums.
- Auth actions return provider error messages in some cases.
- Payment submission can be repeated and transaction IDs are not unique.

Impact:
Spam, account-enumeration clues, payment-review noise, and database growth.

Fix guidance:
- Add rate limiting by IP/session/user for contact, auth, checkout, and mock attempts.
- Add max lengths to public form schemas.
- Return generic auth errors and log details server-side.
- Add transaction ID uniqueness or review workflow constraints.

## P3 Product, UX, SEO, And Performance Improvements

### 21. Footer links point to missing legal pages

Files:
- `src/components/shared/footer.tsx:78-84`
- no `src/app/(marketing)/terms/page.tsx`
- no `src/app/(marketing)/privacy/page.tsx`
- no `src/app/(marketing)/refund/page.tsx`

Impact:
Visible production footer links return 404. This is especially weak for a paid checkout flow.

Fix guidance:
Add Terms, Privacy, and Refund Policy pages, or remove the links until content is approved.

### 22. Image optimization is bypassed

Files:
- `src/components/marketing/program-card.tsx:45-52`
- `src/components/marketing/resource-card.tsx:39-46`
- `src/app/(marketing)/resources/[slug]/page.tsx:64-70`
- `src/app/admin/payments/[id]/page.tsx:145-150`
- `next.config.ts:1-5`

Problem:
Raw `<img>` is used for public cards/detail images. `next.config.ts` has no image remote patterns.

Impact:
Weaker LCP, no automatic resizing or modern formats, and likely layout/performance issues as real images arrive.

Fix guidance:
- Configure `images.remotePatterns` for Supabase/approved CDN hosts.
- Use `next/image` with explicit dimensions or `fill` plus `sizes`.
- Keep signed admin screenshots as a deliberate exception if needed, but constrain size.

### 23. Sitemap and robots include low-value or private-ish routes

Files:
- `src/app/sitemap.ts:9-22`
- `src/app/robots.ts:7-12`
- auth pages under `src/app/(auth)`

Problem:
Sitemap includes `/login` and `/register`. Robots does not disallow auth pages except `/auth/`, which is only the callback route namespace.

Impact:
Search engines can index low-value auth pages.

Fix guidance:
- Remove `/login` and `/register` from sitemap.
- Add `robots: { index: false }` metadata for auth, checkout, dashboard, admin, mentor, and attempt pages as appropriate.
- Confirm canonical URLs after custom domain setup.

### 24. Language state can desync from `<html lang>`

Files:
- `src/app/layout.tsx:67-70`
- `src/components/shared/language-provider.tsx:32-44`

Problem:
Root layout hardcodes `lang="en"`. Persisted Bangla is loaded from localStorage, but the mount effect does not update `document.documentElement.lang` when reading the stored value.

Impact:
Screen readers and SEO can see English while the UI is in Bangla.

Fix guidance:
- Store language in a cookie and set `<html lang>` server-side.
- Or update `document.documentElement.lang` immediately after loading persisted language.
- Add tests for language toggle persistence.

### 25. Form validation errors are not fully accessible

Files:
- `src/components/auth/login-form.tsx`
- `src/components/auth/register-form.tsx`
- `src/components/marketing/contact-form.tsx`
- `src/components/checkout/checkout-form.tsx`

Problem:
Errors are visually rendered, but inputs generally lack `aria-invalid`, `aria-describedby`, and alert/live-region wiring.

Impact:
Assistive technology may not announce errors reliably.

Fix guidance:
- Add stable error ids.
- Wire `aria-describedby` and `aria-invalid`.
- Use `role="alert"` or `aria-live="polite"` for validation summary/errors.

### 26. Optional payment screenshot can block checkout

Files:
- `src/components/checkout/checkout-form.tsx:46-58`
- `src/components/checkout/checkout-form.tsx:112-127`

Problem:
The screenshot is labelled optional, but if upload fails after a user selected a file, the form returns early and payment details are not submitted.

Impact:
Users can be blocked by a bad or oversized optional file.

Fix guidance:
- Validate before upload.
- Add remove/clear file control.
- After upload failure, allow submission without screenshot.
- Explain accepted size/type.

### 27. Launch placeholders remain in content and constants

Files:
- `src/lib/constants.ts:1-15`
- `supabase/seed.sql:25-30`
- `supabase/seed.sql:101-117`
- `supabase/seed.sql:190-201`
- `docs/PROJECT_CONTEXT.md:196-205`

Problems:
- Placeholder community links.
- Placeholder bKash number in seed.
- Placeholder lesson content and live-class meeting URLs.
- Some Bangla seed text appears mojibake-encoded.

Impact:
Production can show placeholder payment, community, and class data.

Fix guidance:
- Replace placeholders before launch.
- Verify all docs/SQL are saved as UTF-8.
- Avoid seeding active payment or live-class rows with placeholders.

### 28. Contact email env is documented but email sending is not implemented

Files:
- `.env.example`
- `README.md:40`
- `src/features/contact/actions.ts:26-27`

Problem:
Docs mention optional Resend env, but contact submission only stores messages.

Impact:
Operators may expect email notifications that never send.

Fix guidance:
- Either implement Resend notification behind optional env vars or remove the env/docs until it exists.
- Add admin notification tests if implemented.

## AI Agent Implementation Checklist

Use this order for remediation:

1. Patch RLS for `profiles`, `mentors`, `mock_questions`, `orders`, `order_items`, `manual_payment_submissions`, and `resources`.
2. Convert schema/policies/storage into ordered migrations and update docs.
3. Fix lint errors and add `typecheck`/`check` scripts.
4. Migrate `src/middleware.ts` to `src/proxy.ts`.
5. Refactor payment checkout/approval into a trusted transaction/RPC.
6. Add error/loading boundaries.
7. Add Playwright and RLS regression tests for the critical flows.
8. Harden storage limits and upload validation.
9. Remove committed operational secrets and rotate credentials.
10. Finish legal pages, SEO robots/sitemap, image optimization, accessibility, and launch placeholders.

## Notes For Future Agents

- Do not rely on UI restrictions where Supabase anon clients can access tables directly.
- Treat every server action as a public POST endpoint.
- Keep service-role usage behind explicit admin/system authorization.
- Do not print or move secret values into new docs.
- After fixing RLS, verify behavior with direct Supabase client calls, not only browser UI tests.
