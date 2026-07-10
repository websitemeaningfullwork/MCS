# MCA — Project Context & Session Handoff

> Read this first when starting a new session. It captures **what the project is,
> what's already built, how it's wired, the gotchas we hit, and what's left**, so
> you don't start from scratch. Companion docs: `HANDOVER.md` (operations),
> `01_MCA_Roadmap_MindMap.md` + `02_MCA_Claude_Code_Prompts.md` (original plan).

_Last updated: after the mentor-panel + login-fix session._

---

## 1. Snapshot

- **Product:** Meaningful Career Academy (MCA) — a premium, mentorship-first
  education platform for Bangladesh. Mentorship is the core; programs, e-books,
  live classes, mock tests, Ask-a-Mentor, blog, community support it.
- **Status:** **MVP is feature-complete, deployed, and live.** All 17 roadmap
  chunks are done, plus a UI/accessibility pass and a dedicated mentor panel.
- **Live site:** https://mcs-pi.vercel.app
- **Repo:** https://github.com/websitemeaningfullwork/MCS (branch `main`)
- **Hosting:** Vercel — auto-deploys on every push to `main`.
- **Backend:** Supabase (project ref `vtfallczxbgdataohthu`, region Singapore).

### Stack (locked)
Next.js **16** (App Router, TS strict, RSC) · Tailwind CSS **v4** (`@theme` in
`globals.css`) · shadcn/ui + Radix + lucide-react · react-hook-form + zod ·
Framer Motion (subtle) · Supabase (Postgres + Auth + Storage + RLS) ·
react-markdown + remark-gfm · @tailwindcss/typography.

> Note: create-next-app installed Next **16**, not 15 as the original docs said.
> It's fully compatible and we stayed on 16.

---

## 2. What's built (all live)

**Public:** Home (10 sections) · About · Contact (saves to `contact_messages`) ·
Programs (list+detail w/ curriculum & sticky enrol card) · Mentors (list+detail) ·
Resources/E-books (list+detail) · Blog (list+detail, markdown) · Community · Live
Classes (upcoming/recorded) · Mock Tests (list+detail+**server-scored attempt**).

**Auth:** email + Google, register/login/forgot/reset, `/auth/callback` route.
Roles: `student` / `mentor` / `admin`. Signup trigger auto-creates `profiles`.

**Student dashboard** (`/dashboard`): overview, my programs, my resources
(signed-URL download), my orders (+detail, resubmit on reject), Ask-a-Mentor
(create/thread/follow-up), settings (profile + avatar upload).

**Learning** (`/dashboard/learn/[slug]`): enrollment-gated YouTube lessons +
curriculum sidebar + mark-complete progress.

**Commerce:** manual **bKash** checkout (order + payment submission + optional
screenshot to private storage). Free items get instant access. **Security-tested:
a student cannot approve their own payment.**

**Admin panel** (`/admin`): overview KPIs · Payment Requests (approve/reject →
grants access) · Payment Settings (bKash number) · Users (change role) · Mentors
(create/edit) · Programs (+ inline modules/lessons) · Resources (+ file upload) ·
Blog · Live Classes · Mock Tests (+ questions) · Questions (answer students).

**Mentor panel** (`/mentor`): overview · my programs · questions (answer assigned
questions) · self-service profile editing. Mentors are blocked from `/admin`.

**SEO/PWA-lite:** `sitemap.ts`, `robots.ts`, dynamic `opengraph-image.tsx`,
custom `not-found.tsx`, per-page `generateMetadata`.

---

## 3. Architecture & key patterns

```
src/
  app/
    (marketing)/   about, contact, programs, mentors, resources, blog,
                   community, live-classes, mock-tests  (+ [slug]/[id] details)
    (auth)/        login, register, forgot-password, reset-password
    auth/callback/ code exchange (OAuth / email confirm / recovery)
    checkout/      manual bKash checkout
    dashboard/     student area (layout guards login)
    mentor/        mentor panel (layout guards mentor|admin)
    admin/         admin panel (layout guards admin)
    page.tsx       home ·  sitemap.ts · robots.ts · opengraph-image.tsx · not-found.tsx
  components/  ui/ (shadcn) · marketing/ · dashboard/ · admin/ · mentor/ ·
               checkout/ · mock-tests/ · shared/ (navbar, footer, logo, toggles, markdown)
  features/    auth, contact, payments, profile, questions, learning,
               mock-tests, mentor, admin/*  (server actions + zod schemas)
  lib/         supabase/{server,browser,admin}.ts, admin-guard.ts, mentor-guard.ts,
               constants.ts, format.ts, slug.ts, motion.ts, i18n.ts, utils.ts
  types/       database.types.ts  (hand-authored, matches supabase gen-types shape)
  proxy.ts     (formerly middleware.ts) session refresh + guards /dashboard,/mentor,/checkout (login) & /admin (role)
supabase/      migrations/000..007 (source of truth); schema.sql/policies.sql/seed.sql (reference)
```

**Supabase clients:** `lib/supabase/server.ts` (RSC/actions, anon key + cookies),
`browser.ts` (client comps), `admin.ts` (service role, `server-only`, guarded —
only for admin-verified/system operations). All are typed with `<Database>`.

**Auth guards:** middleware is the first gate; **pages re-check** via
`requireAdmin()` / `requireMentor()`. Server actions re-verify role too.

**Design tokens:** brand colors map onto shadcn CSS variables in
`globals.css` (`@theme`). Navy + Emerald, cream light / deep-navy dark. Only the
navbar uses the `.glass` Liquid-Glass utility.

**i18n:** light-touch EN/বাংলা dictionary in `lib/i18n.ts` + a client
`LanguageProvider` (localStorage). Content is mostly English; Bangla keys ready.

---

## 4. Database & migrations

- `supabase/migrations/` is the **single source of truth** (run `000`→`007` in
  order). RLS is **ON for every table**. Types: `src/types/database.types.ts`.
  `schema.sql`/`policies.sql` are kept for reference only.
  - `000` base schema + RLS (idempotent; reproduces schema.sql + policies.sql)
  - `001` public read of mentor profiles
  - `002` **fix `is_admin()` RLS recursion** (SECURITY DEFINER) — was a real bug
  - `003` storage buckets: `payment-screenshots` (private), `avatars` (public)
  - `004` `resource-files` private bucket
  - `005` mentor access: read/answer assigned questions + edit own mentor row
  - `006` security hardening: public views, column-guard triggers, storage limits, constraints/indexes
  - `007` scope `answers` INSERT to the question (P1 security)

### Applying a new migration
Preferred: `supabase db push` (Supabase CLI, linked project). Otherwise paste the
migration into the Supabase SQL editor. A one-off `pg`-based helper can also be used
locally — keep it **git-ignored** and pull host/user/password from Supabase →
Settings → Database (connect via the **pooler** host, which is IPv4; the direct
`db.<ref>.supabase.co` host is IPv6-only). Never commit connection details.

---

## 5. Accounts & credentials

- **Admin login:** email + credentials live in the team secret manager (never
  commit them). **Rotate before public launch.**
- **Demo mentors** (seeded via service role, linked to programs):
  `ayesha.mentor@mca.demo`, `sabbir.mentor@mca.demo`, `farhana.mentor@mca.demo`
  — use the "Forgot password" flow to set a password, or promote a real user
  instead. Do not store demo passwords in this repo.
- **Env vars** (in Vercel + local `.env.local`, git-ignored):
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
  The service_role key + DB password live in the Supabase dashboard — **not**
  committed anywhere.

**Onboarding a mentor:** easiest path = have them register normally, then
Admin → Users → set role to **Mentor**. (Admin → Mentors → New creates an account
with a random password, so they'd need the forgot-password flow.)

---

## 6. Gotchas & lessons learned (don't re-discover these)

1. **RSC boundary:** never pass a **function/component** (e.g. a Lucide icon) as a
   prop from a Server Component to a Client Component — throws "Functions cannot
   be passed to Client Components." Pass a **string key** and resolve inside the
   client component (see `components/dashboard/sidebar-nav.tsx`). This caused the
   dashboard/admin login crash.
2. **RLS recursion:** `is_admin()` reads `profiles`, and profiles policies call
   `is_admin()` → infinite recursion unless the function is **SECURITY DEFINER**
   (migration 002).
3. **Mobile grids:** a CSS `grid` with only `lg:grid-cols-*` (no base) creates an
   implicit **max-content** column → horizontal overflow on phones. Always add
   `grid-cols-1` at the base. `body { overflow-x: clip }` is the guardrail.
4. **Headless screenshots:** Chromium enforces a ~500px min window width, so a
   390px screenshot **crops** a 500px layout (looks broken but isn't). Verify
   responsive at **≥500px**.
5. **Framer entrance animations** that start at `opacity:0` can leave elements
   invisible if JS is slow/fails. The navbar now uses a CSS `motion-safe` entrance
   and is visible by default.
6. **Git Bash path conversion:** passing `/admin` as a CLI arg becomes
   `E:/GIT/Git/admin`. Prefix commands with `MSYS_NO_PATHCONV=1`.
7. **Supabase new vs legacy keys:** we use the legacy `anon` + `service_role` JWT
   keys (they still work). The project also has `sb_publishable_/sb_secret_` keys.

### Verifying auth-gated pages locally (headless)
We drive headless Edge via the DevTools Protocol (Node 25 has global `WebSocket`)
to log in and navigate — see git history for the `_cdp.mjs` pattern. Useful to
reproduce server errors that only happen for logged-in users.

---

## 7. Pre-launch checklist (client's side)

- [ ] **Rotate secrets** shared during dev: Supabase `service_role` key + DB
      password; update the new key in Vercel.
- [ ] Set the **real bKash number**: Admin → Payment Settings (still placeholder
      `01XXXXXXXXX`).
- [ ] Set **community links** (Facebook/WhatsApp) via the
      `NEXT_PUBLIC_COMMUNITY_FACEBOOK_URL` / `_WHATSAPP_URL` env vars in Vercel.
- [ ] Re-enable **email confirmation** in Supabase Auth if it was turned off.
- [ ] Replace demo mentors / seed content with real content.
- [ ] (Optional) custom domain on Vercel + add it to Supabase Auth redirect URLs
      and `NEXT_PUBLIC_SITE_URL`.

---

## 8. Ideas / not yet done (Phase 2 & polish)

- Send a **set-password invite email** when Admin creates a mentor (smoother than
  forgot-password).
- Assign **live classes** to a mentor (form currently omits mentor/program) so the
  mentor panel can show "my live classes".
- Bookmarks page (schema + policy exist; UI deferred).
- From the original Phase-2 list: SSLCommerz/Stripe auto-payments, certificate
  PDFs, mock-test leaderboards, realtime notifications, full community forum,
  voice/attachments in Ask-a-Mentor, PWA/analytics. DB is future-proofed for these.
- Deeper a11y audit (axe) and Lighthouse pass.

---

## 9. Everyday workflow

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # full production check (do this before big commits)
npx tsc --noEmit # quick typecheck
```
Commit + push to `main` → Vercel auto-deploys. Keep RLS ON; never put the
service-role key in client code; keep `.env.local` and `_*.mjs` out of git
(already git-ignored).
