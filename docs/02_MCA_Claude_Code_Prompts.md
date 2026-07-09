# 🚀 MCA — Claude Code Chunk-by-Chunk Prompts
> **Companion to:** `01_MCA_Roadmap_MindMap.md`
> **Build tool:** **Claude Code** in the VS Code terminal.
> **How to use:** Paste the **Global Rules** once. Then paste **one chunk at a time** into Claude Code. Wait for it to finish. Run the acceptance checklist. Commit. Then move on.

> These prompts are a simplified MVP rewrite of an older enterprise plan (which was written for the Antigravity IDE). Everything here is now targeted at **Claude Code** and a **200–300 user launch** with a **manual bKash** payment flow.

---

## 🧩 Global Rules — paste ONCE at the very start

Copy this whole block into Claude Code at the beginning of the project (it sets the ground rules for every chunk):

```text
You are helping me build "Meaningful Career Academy (MCA)", a premium, mentorship-first
educational platform for Bangladesh. I am a beginner. Explain briefly what you do, but keep
output focused. Build ONLY what each chunk asks. Do not add extra features.

STACK (locked — do not switch):
- Next.js 15 (App Router, TypeScript strict, React Server Components by default)
- Tailwind CSS v4 (use @theme tokens in globals.css; avoid tailwind.config JS unless required)
- shadcn/ui + Radix UI + lucide-react for primitives and icons
- react-hook-form + zod for every form
- Framer Motion for SUBTLE animations only (250–300ms, ease [0.22,1,0.36,1])
- Supabase (Postgres + Auth + Storage + Row Level Security) — the only backend
- Supabase Storage (private buckets + signed URLs) for uploaded/private files
- Deploy: Vercel. Repo: GitHub.

DO NOT USE (out of scope for MVP):
- SSLCommerz, Stripe, any automatic payment gateway, webhooks, IPN
- Cloudinary, next-intl runtime, Sentry, Plausible/GA4, next-pwa, zustand
- Realtime notifications, voice recording, certificate PDF generation
- Phone OTP login
Payment is a MANUAL bKash flow verified by an admin (details in Chunk 08).

DESIGN LAW:
- Apple-inspired. Minimal before fancy. Trust before sales. Mentorship first.
- Light (default): bg #FAFAF8, surface #FFFFFF, primary #0F172A, accent #0F766E,
  accent-hover #14B8A6, success #22C55E, border #E5E7EB, muted #64748B.
- Dark: bg #0B1220, surface #111827, text #F8FAFC, border #1F2937.
- Radius default xl (16–24px). Shadows soft. Motion subtle.
- Navbar: floating, sticky, blurred (Liquid Glass). Other sections stay clean.
- Fonts: Inter (English) + Hind Siliguri or Noto Sans Bengali (Bangla).
- Text should be Bangla-READY (use a simple dictionary of keys), but content starts in English.

CODING LAW:
- TypeScript strict. NEVER use `any`. NEVER use `// @ts-ignore`.
- Server Components by default. Add "use client" only for interactive components.
- All database mutations happen in Server Actions or Route Handlers.
- NEVER import the Supabase service_role key into a client ("use client") file.
- Row Level Security must be ON for every table. Never disable RLS to fix a query — fix the policy.
- Every form uses react-hook-form + zod.
- Admin-only routes must be protected in middleware AND re-checked server-side on the page.
- A student must never be able to approve their own payment.
- .env.local must never be committed.
- Use semantic HTML and meaningful ids/class names.

WORKFLOW LAW:
- Before writing code, list the files you will create or modify.
- After writing code, print a short "How to verify" checklist.
- Never modify unrelated files.
- If a chunk depends on something not done yet, stop and tell me.
- At the end of each chunk, suggest a single git commit message.
```

---
---

## 🧱 CHUNK 00 — Prerequisites (no code yet)

**Goal:** Confirm the environment is ready before we write anything.

**Paste into Claude Code:**

```text
Before we start coding, confirm these are ready. If any is missing, tell me exactly how to fix it:

1. Node.js LTS installed (v20+). Check: `node -v`. Package manager: npm.
2. Git installed and I am logged into GitHub. Check: `git --version`.
3. A private GitHub repo named "mca-web" exists (empty is fine).
4. I have a Supabase project created, and I know:
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
5. I have a Vercel account and can import a GitHub repo.
6. My current working directory is the empty project folder where I want the app.

Give me the exact terminal commands to verify items 1–2, and a short checklist for 3–6.
Reply "ready to scaffold" once you've listed the checks. Do not write app code yet.
```

**Acceptance checklist:**
- [ ] `node -v` shows v20+
- [ ] `git --version` works
- [ ] Empty `mca-web` repo exists on GitHub
- [ ] You have the 3 Supabase keys saved somewhere safe (not in git)

**Commit:** _(nothing to commit yet)_

---

## 🧱 CHUNK 01 — Scaffold the Next.js 15 project

**Goal:** Create the base app with Tailwind v4, shadcn/ui, and the folder skeleton.

**Files to create/modify:** whole project scaffold, `.env.example`, `.gitignore`, `README.md`.

**Paste into Claude Code:**

```text
Scaffold a Next.js 15 project in the CURRENT directory (do NOT create a subfolder).

Requirements:
- App Router, TypeScript strict, ESLint, Tailwind CSS v4, `src/` directory, import alias `@/*`.
- Package manager: npm.
- Install runtime deps: @supabase/supabase-js @supabase/ssr framer-motion lucide-react
  clsx tailwind-merge class-variance-authority zod react-hook-form @hookform/resolvers next-themes
- Install dev deps: prettier prettier-plugin-tailwindcss
- Initialize shadcn/ui (style "new-york", base color "slate", CSS variables ON).
- Add shadcn components: button input textarea label card dialog dropdown-menu tabs
  avatar badge separator sheet skeleton switch tooltip select checkbox radio-group form
  table sonner.
- Create this folder skeleton (add a .gitkeep in empty folders):
  src/app/(marketing)/, src/app/(auth)/, src/app/checkout/, src/app/dashboard/, src/app/admin/,
  src/components/ui/, src/components/marketing/, src/components/dashboard/, src/components/admin/,
  src/components/shared/, src/features/, src/lib/supabase/, src/styles/, src/types/, supabase/
- Create `.env.example` with these keys (values blank):
  NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM
- Ensure `.env.local` is in `.gitignore` (create `.env.local` from `.env.example` but do NOT commit it).
- Write a short README.md with setup + run instructions.

At the end, print the file tree and the exact commands to install and run dev.
```

**Commands to run:**
```bash
npm install
npm run dev
```

**Acceptance checklist:**
- [ ] `npm run dev` opens `http://localhost:3000` with no TypeScript errors
- [ ] `.env.local` exists locally and is git-ignored
- [ ] Folder skeleton matches Section 11 of the roadmap

**Commit:** `chore: scaffold next 15 app with tailwind v4 and shadcn`

---

## 🧱 CHUNK 02 — Design system, tokens & global layout

**Goal:** Apply the MCA design tokens, load fonts, and build the Liquid-Glass navbar + footer + theme toggle.

**Files:** `src/styles/globals.css`, `src/app/layout.tsx`, `src/lib/motion.ts`,
`src/components/shared/{navbar,footer,theme-provider,theme-toggle,logo,lang-toggle}.tsx`,
`src/lib/i18n.ts` (light-touch dictionary).

**Paste into Claude Code:**

```text
Set up the MCA design system and global layout.

1) Overwrite `src/styles/globals.css`:
   - `@import "tailwindcss";`
   - An `@theme` block with:
       --color-bg:#FAFAF8; --color-surface:#FFFFFF; --color-primary:#0F172A;
       --color-accent:#0F766E; --color-accent-hover:#14B8A6; --color-success:#22C55E;
       --color-warning:#F59E0B; --color-danger:#EF4444; --color-border:#E5E7EB; --color-muted:#64748B;
       --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:24px;
       --shadow-card:0 4px 24px rgba(15,23,42,0.06);
       --font-sans:"Inter", ui-sans-serif, system-ui;
       --font-bengali:"Hind Siliguri","Noto Sans Bengali", var(--font-sans);
   - A `.dark` block: --color-bg:#0B1220; --color-surface:#111827; --color-primary:#F8FAFC;
       --color-border:#1F2937; --color-muted:#94A3B8; --shadow-card:0 4px 24px rgba(0,0,0,0.4);
   - A `.glass` utility: backdrop-filter: blur(20px) saturate(180%);
       background: color-mix(in oklab, var(--color-surface) 70%, transparent);
       border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
   - Map shadcn CSS variables to ours (background→bg, foreground→primary, border→border, etc.).

2) In `src/app/layout.tsx` load Inter and Hind Siliguri via next/font/google. Wrap children in a
   ThemeProvider (next-themes, class strategy, defaultTheme "light"). Add a skip-to-content link.

3) `src/lib/motion.ts`: export `easeApple = [0.22,1,0.36,1] as const` and `fadeUp`, `fadeIn`,
   `scaleIn` variants (250ms).

4) Build in `src/components/shared/`:
   - logo.tsx — text logo "MCA" with a small emerald accent dot.
   - theme-provider.tsx + theme-toggle.tsx (next-themes).
   - lang-toggle.tsx — a simple EN | বাংলা toggle (client). For MVP it toggles a value stored in
     localStorage and swaps a light dictionary; do NOT install next-intl.
   - navbar.tsx ("use client") — floating sticky top with .glass, rounded-2xl, max-w-6xl, top-4.
       Left: <Logo/>. Middle (desktop): Home, Programs, Mentors, E-books, Live Classes, Mock Tests,
       Community, Blog, About, Contact. Right: search icon (placeholder link to /programs),
       LangToggle, ThemeToggle, and a Profile/Login button.
       Mobile: hamburger opens a <Sheet> with the same links. Subtle fade+slide-down on mount.
   - footer.tsx — 4 columns (Company / Learn / Resources / Legal) + bottom row with © MCA {year}
     and social icons.

5) `src/lib/i18n.ts` — a tiny dictionary: `{ en: {...}, bn: {...} }` covering nav.* and common.*
   keys, plus a `useDict()` hook that reads the current language. Keep it minimal.

Wire navbar + footer into the root layout so every page shows them.
```

**Acceptance checklist:**
- [ ] Theme toggle switches light/dark and persists across routes
- [ ] Navbar floats, is sticky, and blurs over content when scrolled
- [ ] Bangla toggle swaps nav labels; Bangla renders in Hind Siliguri
- [ ] No layout shift / no console errors

**Commit:** `feat(design): mca tokens, fonts, glass navbar, footer, theme + lang toggle`

---

## 🧱 CHUNK 03 ⭐ — Supabase schema + Row Level Security (MOST IMPORTANT)

**Goal:** Create every MVP table, the signup trigger, helper functions, RLS policies, and seed data.

> ⚠️ Read the whole chunk first. Apply the SQL in the Supabase **SQL editor** in this order: schema → policies → seed. The full copy-paste SQL is in **Appendix A / B / C** at the end of this file.

**Files:** `supabase/schema.sql`, `supabase/policies.sql`, `supabase/seed.sql`.

**Paste into Claude Code:**

```text
Create the MVP Supabase database files. Use EXACTLY the schema, policies, and seed provided in
Appendix A, B, and C of 02_MCA_Claude_Code_Prompts.md (I will paste them if you don't have them).
Do not invent extra tables. Do not add SSLCommerz/Stripe/certificate/notifications tables.

Tasks:
1) Write `supabase/schema.sql` = Appendix A (enums, tables, signup trigger, is_admin() helper,
   payment_settings). MVP tables only:
   profiles, mentors, categories, programs, modules, lessons, enrollments, lesson_progress,
   resources (e-books + downloadable resources), orders, order_items,
   manual_payment_submissions, questions, answers, live_classes, mock_tests, mock_questions,
   test_attempts, blog_posts, bookmarks, contact_messages, payment_settings.
2) Write `supabase/policies.sql` = Appendix B (enable RLS on every table + policies).
   Key rules: public read for published catalog rows; students read/write only their own rows;
   orders/enrollments/payment approvals are written only via the service role (server actions);
   admins can do everything via is_admin().
3) Write `supabase/seed.sql` = Appendix C (10 categories, 3 mentors, 6 programs with modules+lessons,
   3 e-books/resources, 2 mock tests, 4 blog posts, 1 payment_settings row with a demo bKash number).
4) Give me step-by-step: how to run these three files in the Supabase SQL editor, and the exact
   Supabase CLI command to generate `src/types/database.types.ts`.

Do not run anything yourself — just create the files and give me the instructions.
```

**Commands to run (after pasting SQL in Supabase SQL editor):**
```bash
# generate types (needs supabase CLI + login)
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> --schema public > src/types/database.types.ts
```

**Acceptance checklist (in Supabase dashboard):**
- [ ] All MVP tables created; RLS shows **Enabled** on each
- [ ] Anonymous `SELECT` works for `categories`, `programs where status='published'`, `blog_posts where status='published'`
- [ ] Signing up a user auto-creates a row in `profiles`
- [ ] `payment_settings` has one row with a bKash number
- [ ] `src/types/database.types.ts` generated with no errors

**Commit:** `feat(db): mvp schema, rls policies, seed data`

---

## 🧱 CHUNK 04 — Supabase clients + middleware role guard

**Goal:** Wire Supabase into Next.js and protect `/dashboard` and `/admin`.

**Files:** `src/lib/supabase/{server,browser,admin}.ts`, `middleware.ts`.

**Paste into Claude Code:**

```text
Wire Supabase into the App Router using @supabase/ssr.

Create:
- `src/lib/supabase/server.ts`  → createServerClient() using next/headers cookies().
- `src/lib/supabase/browser.ts` → createBrowserClient().
- `src/lib/supabase/admin.ts`   → a service-role client (SERVER ONLY). Add a runtime guard that
  throws if it is ever imported in a browser/client context. It reads SUPABASE_SERVICE_ROLE_KEY.

Update `middleware.ts` to:
1) Refresh the Supabase session (per official @supabase/ssr middleware docs).
2) Role-guard:
   - /dashboard/**  → requires a logged-in user; else redirect to /login.
   - /admin/**      → requires profiles.role = 'admin'; else redirect to / (home).
   Read the role from the profiles table server-side.
Keep it minimal and typed (no `any`). Explain how to test it.
```

**Acceptance checklist:**
- [ ] Visiting `/admin` while logged out → redirected to `/login`
- [ ] Visiting `/dashboard` while logged out → redirected to `/login`
- [ ] `admin.ts` cannot be imported in a client component (guard throws)

**Commit:** `feat(auth): supabase ssr clients + middleware role guard`

---

## 🧱 CHUNK 05 — Auth pages (register, login, forgot password)

**Goal:** Email/password auth (+ optional Google), with a premium two-column layout.

**Files:** `src/app/(auth)/{login,register,forgot-password}/page.tsx`, `src/features/auth/actions.ts`,
`src/features/auth/schemas.ts`.

**Paste into Claude Code:**

```text
Build authentication with Supabase Auth (email/password). Google login is OPTIONAL — add a
"Continue with Google" button only if it does not require extra setup beyond enabling the provider
in Supabase; otherwise stub it and label it clearly. NO phone OTP.

1) `src/features/auth/schemas.ts` — zod schemas for register (full_name, email, password) and login.
2) `src/features/auth/actions.ts` — server actions: signUpWithEmail, signInWithEmail,
   signInWithGoogle (optional), requestPasswordReset, signOut. Never expose the service role here.
3) Pages under `src/app/(auth)/`:
   - Two-column desktop layout: left = brand panel (soft gradient #FAFAF8 → white, MCA logo,
     tagline "Guidance, not just courses."), right = form card (glass, rounded-2xl, max-w-md).
   - Mobile: single column, form only.
   - Forms use react-hook-form + zod. Password show/hide toggle.
   - register: collects full_name; role always defaults to 'student' (never let user pick admin).
   - Show errors via Sonner toast; loading spinner inside the submit button.
   - After sign-in → redirect to /dashboard. After sign-up → show "check your email" if email
     confirmation is on, else redirect to /dashboard.

Explain how to create my first ADMIN: after registering normally, I run one SQL update in Supabase
to set my profile role to 'admin'. Give me that exact SQL.
```

**Acceptance checklist:**
- [ ] Register a test student → a row appears in `profiles` with role `student`
- [ ] Login works and lands on `/dashboard`
- [ ] You promoted your own account to `admin` via the provided SQL
- [ ] Wrong password shows a toast, not a crash

**Commit:** `feat(auth): register, login, forgot-password pages + actions`

---

## 🧱 CHUNK 06 — Public marketing pages (Home, About, Contact)

**Goal:** Build the premium home page (based on the original flow, trimmed) plus About and Contact.

**Files:** `src/app/(marketing)/page.tsx` + `src/components/marketing/home/*`,
`src/app/(marketing)/about/page.tsx`, `src/app/(marketing)/contact/page.tsx`,
`src/features/contact/actions.ts`.

**Paste into Claude Code:**

```text
Build the public marketing pages. Fetch data server-side with the server Supabase client.

HOME `src/app/(marketing)/page.tsx` — sections (each its own component in
src/components/marketing/home/), keep the premium MCA feel, subtle Framer Motion fadeUp:
1) Hero — headline "Find the Right Mentor. Build a Meaningful Career.",
   description from the spec, two CTAs: "Find Your Mentor" (primary → /mentors),
   "Explore Programs" (outline → /programs), and a placeholder mentor image on the right.
2) MeetMentors — up to 6 featured mentors (from db).
3) LearningPrograms — the 10 category cards with icons.
4) WhyMCA — 4 pillars: Personal Mentor, Live Guidance, Structured Path, Career Support.
5) FeaturedPrograms — up to 6 programs where is_featured = true.
6) SuccessStories — 3 static testimonials (hardcoded ok for MVP).
7) AskMentor — a CTA block: "Ask any question" → routes to /dashboard/questions/new if logged in,
   else /login.
8) LiveClasses — next 3 upcoming live classes (from db).
9) PremiumEbooks — up to 4 resources of type ebook.
10) CommunityCTA — "Join our learning community" with buttons linking to a Facebook/WhatsApp group
    (use placeholder URLs I can edit later). NO realtime forum.
Footer already exists.

ABOUT `/about` — mission, vision, brand story, values (Apple-style long-form, calm spacing).

CONTACT `/contact` — form (name, email, subject, message) using react-hook-form + zod.
On submit, a server action `submitContact` inserts into `contact_messages`. Optionally send an
email via Resend IF RESEND_API_KEY is set (wrap in a try/catch, never block on it). Show a success toast.

Add generateMetadata() (title, description) to each page.
Use semantic HTML (header/section/article) and meaningful ids.
```

**Acceptance checklist:**
- [ ] `/` renders all sections; cards show real seed data (not empty)
- [ ] `/about` and `/contact` render cleanly in both themes
- [ ] Submitting the contact form inserts a row into `contact_messages`
- [ ] No console errors; images have alt text

**Commit:** `feat(marketing): home, about, contact pages`

---

## 🧱 CHUNK 07 — Programs, Mentors, Resources (list + detail)

**Goal:** The catalog. Public list + detail pages with simple DB search/filter (no Cmd+K).

**Files:**
`src/app/(marketing)/programs/page.tsx` + `programs/[slug]/page.tsx`,
`src/app/(marketing)/mentors/page.tsx` + `mentors/[id]/page.tsx`,
`src/app/(marketing)/resources/page.tsx` + `resources/[slug]/page.tsx`,
plus card components under `src/components/marketing/`.

**Paste into Claude Code:**

```text
Build the catalog pages. All data server-fetched. Use SIMPLE database search/filter (a search input
that filters by title via ilike, and a category dropdown). No command palette, no instant global search.

PROGRAMS:
- /programs: a search input + category filter + a responsive grid of ProgramCard
  (cover, title, mentor name, level, price in BDT, rating). Only status='published'.
- /programs/[slug]: hero (title, subtitle, rating, enrolled_count, price with discount),
  an "Enrol" CTA that links to /checkout?type=program&id=<id> (checkout built in Chunk 08),
  tabs: Overview | Curriculum (modules + lessons list, mark preview lessons) | Mentor | FAQ.
  Sticky price card on the right with learning outcomes + requirements.

MENTORS:
- /mentors: grid of MentorCard (photo, headline, expertise pills, rating, "View profile").
  Filter by expertise.
- /mentors/[id]: header (avatar, name, headline, verified badge, rating,
  "Ask a Question" CTA → /dashboard/questions/new). Sections: Bio, Expertise, Programs by mentor.
  (No booking calendar in MVP.)

RESOURCES (e-books + downloadable resources, one table `resources`):
- /resources: grid of cards, filter by kind. Show price (or "Free").
- /resources/[slug]: cover, description, sample preview if sample file exists (signed URL),
  and a "Buy" CTA → /checkout?type=resource&id=<id> for paid items, or a "Download" (signed URL)
  for free items or ones the user already owns.

Add generateMetadata() to detail pages. Semantic HTML, meaningful ids, alt text on images.
```

**Acceptance checklist:**
- [ ] `/programs/<seed-slug>` shows real modules/lessons from Supabase
- [ ] `/mentors/<seed-id>` shows the mentor's programs
- [ ] Search + category filter narrow results correctly
- [ ] Paid resource shows "Buy", free resource shows "Download"

**Commit:** `feat(catalog): programs, mentors, resources list + detail`

---

## 🧱 CHUNK 08 — Manual bKash payment system (the core commerce)

**Goal:** Replace all payment gateways with an admin-verified manual bKash flow.

**Files:** `src/app/checkout/page.tsx`, `src/features/payments/{actions,schemas}.ts`,
`src/components/checkout/*`, a Supabase Storage bucket `payment-screenshots` (private).

**Paste into Claude Code:**

```text
Build the MANUAL bKash payment flow. No gateways, no webhooks. An admin verifies manually.

Setup:
- Create a PRIVATE Supabase Storage bucket `payment-screenshots` and give me the SQL/CLI or dashboard
  steps + a storage RLS policy so a user can upload only to their own folder and only admins can read.

Checkout `/checkout?type=program|resource&id=<uuid>` (logged-in only; middleware already guards
  /checkout? — if not, add the guard):
1) Server-load the item (program or resource) and the active row from `payment_settings`
   (bKash number(s) + instructions + is_active).
2) Show: order summary, total amount (BDT), the bKash number, and clear instructions
   ("Send Money" to this number, then submit the details below).
3) A form (react-hook-form + zod) collecting: sender_number, transaction_id, paid_amount_bdt,
   and an OPTIONAL screenshot upload (uploaded to `payment-screenshots/<userId>/...`).

Server action `submitManualPayment(input)`:
- Runs on the server. Create an `orders` row (status 'pending_verification', total_bdt = item price)
  and an `order_items` row for the item, then a `manual_payment_submissions` row
  (status 'submitted', method 'bkash', linked to the order + user).
- Return the order id. Redirect the student to /dashboard/orders/<id> showing "Waiting for approval".

IMPORTANT SECURITY:
- The student can ONLY create submissions for themselves. They can NEVER set status to approved/paid.
- All inserts happen server-side. RLS must allow a student to insert their own submission but never
  update its status. Approval happens only in the admin action (Chunk 10).
```

**Acceptance checklist:**
- [ ] `/checkout?type=program&id=<seed>` shows total + bKash number + instructions
- [ ] Submitting creates an `orders` row (`pending_verification`) + `order_items` + `manual_payment_submissions`
- [ ] Optional screenshot lands in the private `payment-screenshots` bucket
- [ ] A student cannot change their own order to `paid` (verify by trying in SQL as that user — RLS blocks it)

**Commit:** `feat(payments): manual bkash checkout + submission`

---

## 🧱 CHUNK 09 — Student dashboard

**Goal:** The student's home base: enrolled programs, purchased resources, orders, questions, profile.

**Files:** `src/app/dashboard/layout.tsx` + pages under `src/app/dashboard/*`,
`src/features/profile/actions.ts`.

**Paste into Claude Code:**

```text
Build the student dashboard (all pages server-guarded to a logged-in user).

Layout `src/app/dashboard/layout.tsx` — left sidebar:
Overview · My Programs · My Resources · My Orders · Ask a Mentor · Bookmarks · Settings.

Pages:
- /dashboard (Overview): greeting with the user's name, quick stats (enrolled count, pending orders,
  open questions), and a "Continue learning" card if any enrollment exists.
- /dashboard/programs: enrolled programs with a simple progress indicator + "Open" button
  linking to the learning page (Chunk 13).
- /dashboard/resources: purchased/owned resources with a "Download" button (signed URL).
- /dashboard/orders: list of the user's orders with status badges
  (pending_verification / paid / rejected). /dashboard/orders/[id] shows details, the submitted
  bKash info, and — if rejected — the admin_note plus a "Resubmit payment" button back to checkout.
- /dashboard/questions: already handled in Chunk 12 (leave a link/placeholder for now).
- /dashboard/bookmarks: list bookmarked programs/resources (optional if time allows).
- /dashboard/settings: edit full_name, bio, avatar (upload to a public `avatars` bucket),
  language preference, theme. Uses a server action `updateProfile`. No password change if it adds
  complexity (link to forgot-password instead).

Use shadcn <Table>/<Card>, status <Badge> variants, semantic HTML, meaningful ids.
```

**Acceptance checklist:**
- [ ] `/dashboard` greets the logged-in user by name
- [ ] `/dashboard/orders` shows the order created in Chunk 08 as `pending_verification`
- [ ] A rejected order shows the admin note + a resubmit button
- [ ] Editing profile in Settings persists

**Commit:** `feat(dashboard): student dashboard (programs, resources, orders, settings)`

---

## 🧱 CHUNK 10 — Admin dashboard shell + payment approvals

**Goal:** The admin control room, with the most important feature first: approve/reject payments.

**Files:** `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`,
`src/app/admin/payments/page.tsx` (+ `[id]`), `src/features/payments/admin-actions.ts`.

**Paste into Claude Code:**

```text
Build the admin shell and the payment approval system. Guard every admin page server-side with an
is-admin check (in addition to middleware). Non-admins get redirected to /.

Layout `src/app/admin/layout.tsx` — sidebar:
Overview · Payment Requests · Users · Mentors · Programs · Resources · Blog · Questions ·
Live Classes · Mock Tests · Payment Settings.

Pages:
- /admin (Overview): KPI cards — pending payments count, total students, total programs,
  open questions count.
- /admin/payments: a table of `manual_payment_submissions` joined with orders + user,
  filter by status. Default shows `submitted` / order `pending_verification`.
- /admin/payments/[id]: shows sender_number, transaction_id, paid_amount_bdt, the screenshot
  (admin-signed URL), the order + item, and two buttons: Approve / Reject (Reject opens a note field).

Server actions in `src/features/payments/admin-actions.ts` (SERVICE ROLE, admin-only — verify the
caller is admin before doing anything):
- approvePayment(submissionId): set submission 'approved', order 'paid', and grant access:
    * if item_type='program' → insert an `enrollments` row for the user+program
    * if item_type='resource' → insert into the user's owned resources (an `enrollments`-style access
      row, or a `resource_access` table if defined in schema — use whatever the schema provides).
- rejectPayment(submissionId, note): set submission 'rejected', order 'rejected', save admin_note.
Both must be idempotent and must NOT run for non-admins.

After approve/reject, revalidate the relevant pages so the student's dashboard reflects the change.
```

**Acceptance checklist:**
- [ ] Non-admin cannot open `/admin` (redirected)
- [ ] Admin approves the Chunk 08 order → order becomes `paid`, enrollment created, student sees access
- [ ] Admin rejects with a note → student sees the reason and can resubmit
- [ ] A student calling the approve action fails (admin-only guard works)

**Commit:** `feat(admin): admin shell + manual payment approve/reject`

---

## 🧱 CHUNK 11 — Admin CRUD (mentors, programs, lessons, resources, blog, users, settings)

**Goal:** Let the admin manage all content without touching SQL.

**Files:** CRUD pages under `src/app/admin/*` + matching server actions under `src/features/*`.

**Paste into Claude Code:**

```text
Build admin CRUD. Every list page: server-fetched shadcn <Table> with search + basic pagination.
Every create/edit page: react-hook-form + zod. All mutations = admin-only server actions.

- /admin/users: list users; actions: change role (student/mentor/admin), verify a mentor.
- /admin/mentors: create/edit mentors (headline, expertise[], bio, photo upload, socials, is_featured,
  is_verified). Creating a mentor also sets that profile's role to 'mentor'.
- /admin/programs: list; /admin/programs/new + /[id]/edit — fields: title, slug, subtitle,
  description, category, mentor, price_bdt, discount_bdt, level, cover upload, learning_outcomes[],
  requirements[], is_featured, status (draft/published).
  On the edit page, manage MODULES and LESSONS inline: add/reorder modules; add lessons with
  title, YouTube video URL, content text, is_preview, sort_order.
- /admin/resources: create/edit e-books & resources (title, slug, kind, cover, description,
  price_bdt, main file upload to private bucket, optional sample file, is_featured).
- /admin/blog: create/edit blog posts (title, slug, excerpt, cover, content markdown,
  status draft/published, tags[]).
- /admin/settings (Payment Settings): edit the `payment_settings` row(s) — bKash number(s),
  instructions text, is_active.

Keep forms consistent using shared components. Validate slugs are unique. No `any`, no ts-ignore.
```

**Acceptance checklist:**
- [ ] Admin creates a new program with modules/lessons → it appears on `/programs` when published
- [ ] Admin creates a mentor → profile role becomes `mentor`, shows on `/mentors`
- [ ] Admin edits Payment Settings → new bKash number shows on checkout
- [ ] Admin changes a user's role successfully

**Commit:** `feat(admin): crud for users, mentors, programs, lessons, resources, blog, settings`

---

## 🧱 CHUNK 12 — Ask-a-Mentor (text only)

**Goal:** Students ask text questions; admin/mentor answers; status tracked. No voice, no attachments.

**Files:** `src/app/dashboard/questions/*`, `src/app/admin/questions/*`,
`src/features/questions/{actions,schemas}.ts`.

**Paste into Claude Code:**

```text
Build the Ask-a-Mentor system (TEXT ONLY — no voice recording, no file attachments in MVP).

Student side:
- /dashboard/questions: list the student's questions with status badges (waiting/answered/closed).
- /dashboard/questions/new: form (title, body, optional program tag, optional mentor tag) →
  server action createQuestion inserts a `questions` row with status 'waiting', student_id = current user.
- /dashboard/questions/[id]: thread view — the question + any answers. Student can add a follow-up
  reply (also stored as an answer with author = student, or a simple message — keep it simple).

Admin/mentor side:
- /admin/questions: inbox of all questions, filter by status. /admin/questions/[id]:
  view the question + a composer to post an answer. Posting an answer:
    * inserts an `answers` row (author = current admin/mentor)
    * updates the question status to 'answered'
  Admin can also set status to 'closed'.

RLS: a student reads only their own questions/answers; admins read all. Community-visibility
questions can be read publicly (schema supports it) but keep the UI private for MVP.
Show success/error via Sonner. Semantic HTML, meaningful ids.
```

**Acceptance checklist:**
- [ ] Student submits a question → appears with status `waiting`
- [ ] Admin answers → status becomes `answered`; student sees the answer
- [ ] A student cannot see another student's private question

**Commit:** `feat(ask): text-only ask-a-mentor with status flow`

---

## 🧱 CHUNK 13 — Learning delivery (enrolled content + YouTube lessons)

**Goal:** Enrolled students watch lessons (YouTube embeds) and optionally mark them complete.

**Files:** `src/app/dashboard/learn/[programSlug]/page.tsx`
(and optionally `.../[lessonId]/page.tsx`), `src/features/learning/actions.ts`.

**Paste into Claude Code:**

```text
Build the learning delivery page. Access is ENROLLMENT-GATED (server check: the user must have an
enrollment for this program, or be admin).

- /dashboard/learn/[programSlug]: 
  * Server-verify enrollment; if not enrolled, redirect to the program detail page.
  * Left/main: the current lesson — a YouTube embed (from the lesson's video_url; support unlisted
    embed URLs) + the lesson text content rendered from markdown.
  * Right sidebar: curriculum accordion (modules → lessons) with a completion tick per lesson.
  * A "Mark complete" button → server action markLessonComplete(lessonId) upserts a `lesson_progress`
    row (is_completed=true) and recomputes enrollments.progress as
    (completed lessons / total lessons) * 100.
- Only render private lesson content for enrolled users. Preview lessons (is_preview=true) may be
  visible on the public program page, but full content stays gated here.

No certificate generation (Phase 2). Keep it simple and fast. No `any`.
```

**Acceptance checklist:**
- [ ] A non-enrolled user is redirected away from `/dashboard/learn/...`
- [ ] An enrolled user sees the YouTube lesson + curriculum sidebar
- [ ] "Mark complete" updates `lesson_progress` and the program progress %

**Commit:** `feat(learn): enrollment-gated lessons with youtube + progress`

---

## 🧱 CHUNK 14 — Live classes + simple mock tests

**Goal:** Two light features: live class listings (link only) and a basic MCQ test.

**Files:** `src/app/(marketing)/live-classes/page.tsx`,
`src/app/(marketing)/mock-tests/page.tsx` + `[slug]/page.tsx` + attempt page,
`src/features/mock-tests/actions.ts`.

**Paste into Claude Code:**

```text
Build two simple features.

LIVE CLASSES (link-only, no attendance, no calendar):
- /live-classes: tabs Upcoming | Recorded. Each card: title, date/time, mentor, program,
  and a "Join" button that opens meeting_url (or a YouTube link) in a new tab.
  Upcoming = starts_at in the future. Recorded = has replay_url. Data from `live_classes`.
  Admin creates these in /admin/live-classes (add that simple CRUD page: title, mentor, program,
  starts_at, meeting_url, replay_url, is_public).

MOCK TESTS (basic MCQ):
- /mock-tests: list tests (title, category, free/paid). 
- /mock-tests/[slug]: details + "Start Test" (free tests open to logged-in users; paid tests require
  ownership — for MVP you may treat all seeded tests as free).
- /mock-tests/[slug]/attempt: render questions from `mock_questions` (question + options jsonb),
  let the user select answers, then Submit.
  Server action submitAttempt(answers): score the attempt SERVER-SIDE (never trust the client),
  store a `test_attempts` row (score, total, answers jsonb), and show a result page with the score
  and per-question correct answer + explanation. No leaderboard (Phase 2).

Admin can create tests + questions in /admin/mock-tests (simple CRUD).
Semantic HTML, meaningful ids, no `any`.
```

**Acceptance checklist:**
- [ ] `/live-classes` lists seeded classes; "Join" opens the link
- [ ] A student can attempt a seeded mock test and see a server-computed score
- [ ] Admin can create a live class and a mock test

**Commit:** `feat(extras): live classes list + basic mcq mock tests`

---

## 🧱 CHUNK 15 — Blog, community CTA & polish

**Goal:** Finish the blog reader, wire the community CTA, and tidy shared UI.

**Files:** `src/app/(marketing)/blog/page.tsx` + `[slug]/page.tsx`,
`src/app/(marketing)/community/page.tsx`, small shared component fixes.

**Paste into Claude Code:**

```text
Finish content pages and polish.

BLOG:
- /blog: grid of published posts, filter by tag.
- /blog/[slug]: render content_md with a markdown component + prose styling (readable line length,
  good spacing). Show cover, title, date, tags. generateMetadata() from the post.

COMMUNITY (MVP = static CTA, NOT a forum):
- /community: a clean page explaining the community + big buttons linking to the Facebook and
  WhatsApp groups (placeholder URLs I can edit in one place, e.g. src/lib/constants.ts), plus a
  simple "Announcements" list pulled from published blog_posts tagged "announcement" (optional).

POLISH:
- Ensure the navbar "Programs" item can show a simple dropdown of categories (a light Radix dropdown,
  NOT the full mega menu). Keep it subtle.
- Consistent empty states ("No programs yet") and loading skeletons on list pages.
- Verify all images have alt text and all form fields have labels.
```

**Acceptance checklist:**
- [ ] `/blog/<seed-slug>` renders markdown cleanly
- [ ] `/community` links out to FB/WhatsApp (placeholders editable in constants)
- [ ] Programs dropdown shows categories
- [ ] Empty + loading states look intentional

**Commit:** `feat(content): blog reader, community cta, ui polish`

---

## 🧱 CHUNK 16 — SEO, responsive QA, accessibility & final seed check

**Goal:** Make it fast, findable, accessible, and full of demo data.

**Files:** `src/app/sitemap.ts`, `src/app/robots.ts`, misc metadata + a11y fixes.

**Paste into Claude Code:**

```text
Final quality pass (no PWA, no Sentry, no analytics for MVP).

1) src/app/sitemap.ts — enumerate static routes + dynamic (published programs, mentors, resources,
   blog posts) from Supabase.
2) src/app/robots.ts — allow all, point to the sitemap.
3) Ensure every public page has generateMetadata() (title, description, and a default OG image
   from /public).
4) Responsive QA: check home, programs list/detail, mentors, dashboard, admin at mobile (375px),
   tablet (768px), desktop (1280px). Fix overflow and tap targets.
5) Accessibility pass: alt text on all images, <Label> on every field, visible focus rings,
   skip-to-content link present, brand-color contrast meets AA.
6) Confirm the seed data covers every page so nothing looks empty. If any page is empty, tell me
   which seed rows to add.

Give me a short manual QA checklist to run in the browser before deploying.
```

**Acceptance checklist:**
- [ ] `/sitemap.xml` and `/robots.txt` respond correctly
- [ ] Every public page has a title + description
- [ ] No horizontal scroll on mobile; focus rings visible
- [ ] No empty pages with seed data loaded

**Commit:** `feat(quality): sitemap, robots, seo metadata, a11y + responsive fixes`

---

## 🧱 CHUNK 17 — Deploy to Vercel + launch checklist

**Goal:** Ship it.

**Paste into Claude Code:**

```text
Prepare for production deployment on Vercel.

1) Verify `.env.example` lists EVERY env var referenced in the code (grep for process.env).
2) Give me the exact steps to:
   - push the repo to GitHub `main`
   - import it into Vercel and add all env vars (Production + Preview):
     NEXT_PUBLIC_SITE_URL (the vercel domain), NEXT_PUBLIC_SUPABASE_URL,
     NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and RESEND_* if used.
3) Remind me to set NEXT_PUBLIC_SITE_URL to the production domain and to add that domain to
   Supabase Auth "Redirect URLs" / allowed origins (list the exact Supabase settings to update).
4) Give me a production SMOKE TEST checklist:
   - register + login work on the live site
   - browse a program → checkout → submit bKash payment → order shows pending_verification
   - admin approves → student gets access → lesson plays
   - admin rejects another → student sees reason
   - ask a question → admin answers → student sees it
   - contact form saves a row
5) Confirm RLS is ON in production and the service role key is only in Vercel server env (never
   NEXT_PUBLIC_).

Do NOT run wrangler or any Cloudflare command — this project deploys to Vercel.
```

**Acceptance checklist:**
- [ ] Production build is green on Vercel
- [ ] All env vars set; service role key is **not** `NEXT_PUBLIC_`
- [ ] Supabase Auth redirect URLs include the production domain
- [ ] All smoke tests pass on the live URL

**Commit:** `chore: production deploy ready (vercel)`

---

## 🧭 Optional Phase 2 chunks (do NOT build for launch)

Only start these after the MVP is live and stable:

- **P2-A — SSLCommerz** (add automatic bKash/Nagad/Rocket/cards next to manual bKash; init + IPN + validate)
- **P2-B — Mentor dashboard** (assign questions to specific mentors; mentors answer their own inbox)
- **P2-C — Voice + attachments** in Ask-a-Mentor (Supabase Storage private uploads)
- **P2-D — Certificates** (@react-pdf/renderer + public `/verify/[code]` page)
- **P2-E — Mock test leaderboard + analytics**
- **P2-F — Full community forum** (posts + comments; optional Supabase Realtime)
- **P2-G — Realtime notifications** (bell + Supabase Realtime + Resend emails)
- **P2-H — Stripe** for international students
- **P2-I — Cmd+K global search** (Postgres full-text + GIN indexes)
- **P2-J — PWA, analytics (Plausible), Sentry monitoring**

Each is an addition, not a rewrite, because the MVP DB was designed to be future-proof.

---
---

# 📎 Appendix A — MVP Supabase schema (copy-paste into SQL editor)

> Run this first, then Appendix B (policies), then Appendix C (seed).

```sql
-- ============================================================
-- MCA MVP — schema (extensions, enums, tables, trigger, helpers)
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type user_role         as enum ('student','mentor','admin');
create type program_level     as enum ('beginner','intermediate','advanced','all_levels');
create type program_status    as enum ('draft','published','archived');
create type question_status    as enum ('waiting','answered','closed');
create type question_visibility as enum ('private','community');
create type resource_kind     as enum ('ebook','cv_template','roadmap','interview','productivity','scholarship','other');
create type order_status       as enum ('pending_payment','pending_verification','paid','rejected','cancelled');
create type submission_status  as enum ('submitted','approved','rejected');
create type post_status        as enum ('draft','published');
create type test_type          as enum ('topic','practice','full');

-- 1. profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  phone text,
  role user_role not null default 'student',
  bio text,
  locale text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. mentors (1-1 with a profile where role='mentor')
create table public.mentors (
  id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  expertise text[],
  skills text[],
  years_experience int,
  rating numeric(3,2) default 0,
  reviews_count int default 0,
  whatsapp text,
  linkedin_url text,
  is_verified boolean default false,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- 3. categories
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_bn text,
  icon text,
  sort_order int default 0
);

-- 4. programs
create table public.programs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  title_bn text,
  subtitle text,
  description text,
  description_bn text,
  cover_url text,
  preview_video_url text,
  category_id uuid references public.categories(id),
  mentor_id uuid references public.mentors(id),
  price_bdt numeric(10,2) not null default 0,
  discount_bdt numeric(10,2) default 0,
  level program_level default 'all_levels',
  duration_minutes int,
  language text default 'en',
  learning_outcomes text[],
  requirements text[],
  is_featured boolean default false,
  is_bestseller boolean default false,
  is_trending boolean default false,
  status program_status default 'draft',
  rating numeric(3,2) default 0,
  reviews_count int default 0,
  enrolled_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.programs(status);
create index on public.programs(category_id);
create index on public.programs(mentor_id);

-- 5. modules & lessons
create table public.modules (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references public.programs(id) on delete cascade,
  title text not null,
  sort_order int default 0
);
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  video_url text,          -- YouTube unlisted/embed URL
  content_md text,
  duration_seconds int,
  is_preview boolean default false,
  sort_order int default 0
);

-- 6. enrollments & progress (also used to grant resource access)
create table public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  progress numeric(5,2) default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, program_id)
);
create table public.lesson_progress (
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  is_completed boolean default false,
  seconds_watched int default 0,
  notes text,
  updated_at timestamptz default now(),
  primary key(user_id, lesson_id)
);

-- 7. resources (e-books + downloadable resources, unified)
create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  author text,
  kind resource_kind not null default 'ebook',
  cover_url text,
  description text,
  price_bdt numeric(10,2) not null default 0,
  file_storage_path text,   -- private bucket path
  sample_storage_path text, -- optional sample
  external_url text,
  pages int,
  is_featured boolean default false,
  is_premium boolean default false,
  created_at timestamptz default now()
);
-- who owns which resource (granted on payment approval)
create table public.resource_access (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  order_id uuid,
  created_at timestamptz default now(),
  unique(user_id, resource_id)
);

-- 8. orders + items + manual payment submissions
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  total_bdt numeric(10,2) not null,
  status order_status default 'pending_verification',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  item_type text check (item_type in ('program','resource')),
  item_id uuid not null,
  title text,
  price_bdt numeric(10,2) not null,
  quantity int default 1
);
create table public.manual_payment_submissions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  method text not null default 'bkash',
  sender_number text not null,
  transaction_id text not null,
  paid_amount_bdt numeric(10,2) not null,
  screenshot_path text,
  status submission_status default 'submitted',
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 9. Ask-a-Mentor
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade,
  mentor_id uuid references public.mentors(id),
  program_id uuid references public.programs(id),
  title text,
  body text,
  visibility question_visibility default 'private',
  status question_status default 'waiting',
  created_at timestamptz default now()
);
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade,
  author_id uuid references public.profiles(id), -- admin/mentor (or student follow-up)
  body text not null,
  created_at timestamptz default now()
);

-- 10. live classes (link only)
create table public.live_classes (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references public.programs(id),
  mentor_id uuid references public.mentors(id),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  replay_url text,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- 11. mock tests (basic MCQ)
create table public.mock_tests (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  category_id uuid references public.categories(id),
  test_type test_type default 'topic',
  duration_minutes int,
  total_marks int,
  is_free boolean default true,
  price_bdt numeric(10,2) default 0,
  created_at timestamptz default now()
);
create table public.mock_questions (
  id uuid primary key default uuid_generate_v4(),
  mock_test_id uuid references public.mock_tests(id) on delete cascade,
  question text not null,
  options jsonb not null,      -- [{key,label}]
  correct_key text not null,
  marks int default 1,
  explanation text,
  sort_order int default 0
);
create table public.test_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  mock_test_id uuid references public.mock_tests(id) on delete cascade,
  score int,
  total int,
  answers jsonb,
  started_at timestamptz default now(),
  submitted_at timestamptz
);

-- 12. blog
create table public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  title_bn text,
  excerpt text,
  cover_url text,
  content_md text,
  author_id uuid references public.profiles(id),
  status post_status default 'draft',
  published_at timestamptz,
  tags text[],
  created_at timestamptz default now()
);

-- 13. bookmarks (polymorphic) + contact + payment settings
create table public.bookmarks (
  user_id uuid references public.profiles(id) on delete cascade,
  item_type text,
  item_id uuid,
  created_at timestamptz default now(),
  primary key(user_id, item_type, item_id)
);
create table public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text, email text, subject text, body text,
  created_at timestamptz default now()
);
create table public.payment_settings (
  id uuid primary key default uuid_generate_v4(),
  label text default 'bKash',
  bkash_number text not null,
  instructions text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- ===== Trigger: auto-create profile on signup =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url')
  on conflict(id) do nothing;
  return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== Helper: is_admin() =====
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce((select role='admin' from public.profiles where id = auth.uid()), false)
$$;
```

---

# 📎 Appendix B — MVP Row Level Security policies (copy-paste)

> Run after Appendix A.

```sql
-- Enable RLS on every table
alter table public.profiles                    enable row level security;
alter table public.mentors                     enable row level security;
alter table public.categories                  enable row level security;
alter table public.programs                    enable row level security;
alter table public.modules                     enable row level security;
alter table public.lessons                     enable row level security;
alter table public.enrollments                 enable row level security;
alter table public.lesson_progress             enable row level security;
alter table public.resources                   enable row level security;
alter table public.resource_access             enable row level security;
alter table public.orders                      enable row level security;
alter table public.order_items                 enable row level security;
alter table public.manual_payment_submissions  enable row level security;
alter table public.questions                   enable row level security;
alter table public.answers                     enable row level security;
alter table public.live_classes                enable row level security;
alter table public.mock_tests                  enable row level security;
alter table public.mock_questions              enable row level security;
alter table public.test_attempts               enable row level security;
alter table public.blog_posts                  enable row level security;
alter table public.bookmarks                   enable row level security;
alter table public.contact_messages            enable row level security;
alter table public.payment_settings            enable row level security;

-- Profiles
create policy "profiles: read own or admin"  on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- Mentors (public read; admin write)
create policy "mentors: public read"  on public.mentors for select using (true);
create policy "mentors: admin write"  on public.mentors for all
  using (public.is_admin()) with check (public.is_admin());

-- Categories (public read; admin write)
create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- Programs (public read published; admin write)
create policy "programs: read published or admin" on public.programs for select
  using (status='published' or public.is_admin());
create policy "programs: admin write" on public.programs for all
  using (public.is_admin()) with check (public.is_admin());

-- Modules & Lessons
create policy "modules: read via program" on public.modules for select
  using (exists(select 1 from public.programs p where p.id=program_id
                and (p.status='published' or public.is_admin())));
create policy "modules: admin write" on public.modules for all
  using (public.is_admin()) with check (public.is_admin());

create policy "lessons: read preview/enrolled/admin" on public.lessons for select
  using (
    is_preview = true
    or public.is_admin()
    or exists(select 1 from public.enrollments e
              join public.modules m on m.id = lessons.module_id
              where e.user_id = auth.uid() and e.program_id = m.program_id)
  );
create policy "lessons: admin write" on public.lessons for all
  using (public.is_admin()) with check (public.is_admin());

-- Enrollments (user reads own; writes via service role/admin only)
create policy "enrollments: own or admin" on public.enrollments for select
  using (user_id = auth.uid() or public.is_admin());
create policy "enrollments: admin write" on public.enrollments for all
  using (public.is_admin()) with check (public.is_admin());

-- Lesson progress (own)
create policy "lesson_progress: own" on public.lesson_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Resources (public read; admin write)
create policy "resources: public read" on public.resources for select using (true);
create policy "resources: admin write" on public.resources for all
  using (public.is_admin()) with check (public.is_admin());

-- Resource access (own read; admin write)
create policy "resource_access: own or admin" on public.resource_access for select
  using (user_id = auth.uid() or public.is_admin());
create policy "resource_access: admin write" on public.resource_access for all
  using (public.is_admin()) with check (public.is_admin());

-- Orders (student reads own; student may INSERT own pending order; status changes = admin only)
create policy "orders: own or admin read" on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy "orders: student insert own" on public.orders for insert
  with check (user_id = auth.uid() and status = 'pending_verification');
create policy "orders: admin update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

-- Order items (own via order; student insert own; admin all)
create policy "order_items: own or admin read" on public.order_items for select
  using (exists(select 1 from public.orders o where o.id=order_id
                and (o.user_id = auth.uid() or public.is_admin())));
create policy "order_items: student insert own" on public.order_items for insert
  with check (exists(select 1 from public.orders o where o.id=order_id and o.user_id = auth.uid()));
create policy "order_items: admin write" on public.order_items for all
  using (public.is_admin()) with check (public.is_admin());

-- Manual payment submissions (student inserts + reads own as 'submitted'; only admin changes status)
create policy "mps: own or admin read" on public.manual_payment_submissions for select
  using (user_id = auth.uid() or public.is_admin());
create policy "mps: student insert own" on public.manual_payment_submissions for insert
  with check (user_id = auth.uid() and status = 'submitted');
create policy "mps: admin update" on public.manual_payment_submissions for update
  using (public.is_admin()) with check (public.is_admin());
-- NOTE: no student UPDATE policy → a student can NEVER change status to approved.

-- Questions & Answers
create policy "questions: read own/community/admin" on public.questions for select
  using (student_id = auth.uid() or visibility = 'community' or public.is_admin());
create policy "questions: student insert own" on public.questions for insert
  with check (student_id = auth.uid());
create policy "questions: owner/admin update" on public.questions for update
  using (student_id = auth.uid() or public.is_admin());

create policy "answers: read via question" on public.answers for select
  using (exists(select 1 from public.questions q where q.id = question_id
                and (q.student_id = auth.uid() or q.visibility='community' or public.is_admin())));
create policy "answers: auth insert" on public.answers for insert
  with check (author_id = auth.uid());

-- Live classes (public read published; admin write)
create policy "live: public read" on public.live_classes for select
  using (is_public = true or public.is_admin());
create policy "live: admin write" on public.live_classes for all
  using (public.is_admin()) with check (public.is_admin());

-- Mock tests + questions + attempts
create policy "mocks: public read" on public.mock_tests for select using (true);
create policy "mocks: admin write" on public.mock_tests for all
  using (public.is_admin()) with check (public.is_admin());
create policy "mockq: read via test" on public.mock_questions for select
  using (exists(select 1 from public.mock_tests m where m.id = mock_test_id));
create policy "mockq: admin write" on public.mock_questions for all
  using (public.is_admin()) with check (public.is_admin());
create policy "attempts: own" on public.test_attempts for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- Blog (public read published; admin/author write)
create policy "blog: read published or admin" on public.blog_posts for select
  using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy "blog: admin/author write" on public.blog_posts for all
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- Bookmarks (own)
create policy "bookmarks: own" on public.bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Contact (anyone can insert; admin reads)
create policy "contact: anyone insert" on public.contact_messages for insert with check (true);
create policy "contact: admin read"    on public.contact_messages for select using (public.is_admin());

-- Payment settings (public read active; admin write)
create policy "psettings: public read" on public.payment_settings for select using (true);
create policy "psettings: admin write" on public.payment_settings for all
  using (public.is_admin()) with check (public.is_admin());
```

---

# 📎 Appendix C — Seed data (copy-paste)

> Run after Appendix B. Edit the demo bKash number before going live.

```sql
-- Categories (10, per the spec's mega menu)
insert into public.categories (slug, name, icon, sort_order) values
  ('university-admission','University Admission','graduation-cap',1),
  ('hsc','HSC','book-open',2),
  ('ssc','SSC','book',3),
  ('programming','Programming','code',4),
  ('ai','AI','brain',5),
  ('english','English','languages',6),
  ('career-development','Career Development','briefcase',7),
  ('productivity','Productivity','zap',8),
  ('soft-skills','Soft Skills','users',9),
  ('free-programs','Free Programs','gift',10)
on conflict (slug) do nothing;

-- Payment settings (EDIT the number before launch)
insert into public.payment_settings (label, bkash_number, instructions, is_active) values
  ('bKash Personal', '01XXXXXXXXX',
   'Open bKash → Send Money to the number above → then submit your sender number, transaction ID, and amount below. We verify within 24 hours.',
   true);

-- NOTE on mentors/programs/blog:
-- Mentors require real auth.users rows (mentors.id → profiles.id → auth.users.id).
-- For seeding, the simplest path is:
--   1) Register 3 accounts via the app (e.g. mentor1@demo.com ...).
--   2) In SQL, set their profiles.role='mentor' and insert matching mentors rows.
--   3) Then insert programs referencing those mentor ids.
-- Ask Claude Code to generate a small SQL block that, given three known profile UUIDs,
-- inserts mentors + 6 programs (with modules/lessons) + 3 resources + 2 mock tests + 4 blog posts.
-- Keep at least 2 programs is_featured=true and status='published' so the home page is not empty.
```

> When you reach Chunk 03, ask Claude Code: *"Generate the mentor + program + resource + mock test + blog seed SQL using these three profile UUIDs: … — at least 2 featured published programs, each with 2 modules and 3 lessons (use real YouTube embed URLs), and mark preview on the first lesson."*

---

# 📎 Appendix D — Supabase Storage buckets

Create these buckets in Supabase → Storage:

| Bucket | Purpose | Public? |
|---|---|---|
| `avatars` | User profile photos | public read |
| `covers` | Program / resource / blog cover images | public read |
| `resource-files` | E-book PDFs & premium resources (gated) | **private** (signed URLs) |
| `resource-samples` | Sample pages of e-books | **private** (signed URLs) |
| `payment-screenshots` | bKash payment proof uploads | **private** (owner + admin only) |

For each **private** bucket, add a Storage RLS policy so a user can upload only to their own
`<userId>/…` folder, and only the owner or an admin can read. Ask Claude Code to generate those
Storage policies in Chunk 08.

---

# 📎 Appendix E — Environment variables

```
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # SERVER ONLY — never prefix with NEXT_PUBLIC_

# Resend (optional — contact/admin email only)
RESEND_API_KEY=
RESEND_FROM="MCA <onboarding@resend.dev>"
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must **never** appear in client code or start with `NEXT_PUBLIC_`.
> Keep `.env.local` out of git. Add the same vars in the Vercel dashboard for Production + Preview.

---

# 📎 Appendix F — When Claude Code gets stuck

1. **Generates too much at once** → *"Split that into 3 steps. Do only step 1 now."*
2. **Uses Tailwind v3 syntax** → *"Use Tailwind v4 with @theme in globals.css only. Do not create tailwind.config.js unless mandatory."*
3. **Uses Pages Router** → *"App Router only. Never create files under /pages. Never use getServerSideProps."*
4. **Puts service role key in a client file** → *"You imported admin.ts in a 'use client' file. Move that call into a server action."*
5. **Disables RLS to fix a query** → *"Never disable RLS. Fix the policy instead."*
6. **Tries to add a cut feature** (SSLCommerz, certificates, realtime) → *"That is Phase 2. Skip it. MVP uses manual bKash / no realtime."*
7. **Uses `any` or `@ts-ignore`** → *"Remove it. Type it properly."*

---

## 🎯 You're ready. Paste the Global Rules, then start with Chunk 00.
