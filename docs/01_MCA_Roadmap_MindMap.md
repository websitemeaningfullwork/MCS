# 🧭 MCA — MVP Roadmap & Mind Map
> **Project:** Meaningful Career Academy (MCA)
> **Type:** Premium Mentorship-Based Educational Platform (Bangladesh)
> **For:** A beginner building with **Claude Code** inside VS Code's terminal
> **First launch target:** ~200–300 users
> **Companion file:** `02_MCA_Claude_Code_Prompts.md`

---

## 0. How to read this document

This file is your **map**. It explains **what MCA is, what we are building now, what we are cutting, and in what order to build**. It contains **no code** — the actual step-by-step build prompts live in `02_MCA_Claude_Code_Prompts.md`, split into ~17 numbered "chunks" you paste into Claude Code one at a time.

> **Golden rule:** Finish and verify **one chunk** before starting the next. Never paste two chunks at once.

> **Note on history:** This roadmap is a simplified rewrite of an earlier, much larger enterprise plan (originally written for the Antigravity IDE). We deliberately removed enterprise features so a beginner can actually launch. The old files were adapted for **Claude Code**, which is what you will use now.

---

## 1. Project summary

**Meaningful Career Academy (MCA)** is a **premium, mentorship-first educational platform for Bangladesh.**

It is **NOT** a coaching-center website. It is **NOT** just a course marketplace.

**Mentorship is the heart of the product.** Everything else — programs, e-books, live classes, mock tests, Ask-a-Mentor, career resources, community — exists to **support the mentorship experience.**

When a visitor lands on MCA, they should feel:

> *"This is where someone will personally guide me toward my career."*

**Not:**

> *"This website just wants to sell me a course."*

### Brand personality (keep this feel)
Premium · Modern · Minimal · Trustworthy · Human-centered · Apple-inspired · Clean · Bilingual (English + বাংলা) · Mobile-first.

### Positioning inspiration
Apple · Stripe · Linear · Notion · Coursera · Arc Browser — **not** a traditional Bangladeshi coaching site.

---

## 2. MVP philosophy

We are building a **real, launchable product for 200–300 users** — not a giant enterprise LMS.

The rule for every feature decision:

> **For 200–300 users, keep only what is needed for launch, trust, payment, content delivery, admin control, and mentorship. Cut anything that adds engineering complexity without immediate business value.**

Three principles guide every cut:

1. **Mentorship first.** If a feature strengthens the mentorship feeling, keep it.
2. **Manual before automated.** A human admin can do a lot at 200 users. Automate later.
3. **Simple before clever.** No realtime, no webhooks, no PDF engines in v1.

We keep the **premium MCA design** exactly. We simplify only the **engineering scope**.

---

## 3. What we are building NOW (MVP scope)

### Public marketing site
- Home page (premium, based on the original 12-section flow, trimmed sensibly)
- Programs list + Program detail
- Mentors list + Mentor detail
- E-books / Resources list + detail
- Blog list + Blog post
- About page
- Contact page (saves message to database)
- English/বাংলা-**ready** structure (content starts mostly English, Bangla keys ready)

### Auth (kept simple)
- Email + password registration & login
- Google login (via Supabase Auth — only if it does not slow launch)
- Password reset (if simple)
- Roles: `guest`, `student`, `mentor`, `admin`

### Student features
- Student dashboard
- View enrolled programs
- View purchased e-books / resources
- Submit an **Ask-a-Mentor** text question
- View question status + mentor answer
- Submit a **manual bKash payment** request
- View payment / order status
- Edit basic profile

### Admin features (this is the control room)
- Admin dashboard
- Manage users (change role, verify mentor)
- Manage mentors, programs, modules/lessons
- Manage e-books / resources
- Manage blog posts
- Manage Ask-a-Mentor questions + reply
- Manage manual payment requests → **Approve / Reject**
- Manually grant access if needed

### Learning delivery (MVP)
- Program detail page
- Enrolled content page (modules + lessons)
- **YouTube unlisted/embed** video support (required — no video hosting)
- Lesson text/content
- Simple "mark complete" progress (optional)

### Ask-a-Mentor (MVP)
- Text question only
- Optional category/program tag
- Status: `waiting` → `answered` → `closed`
- Admin/mentor replies from the panel
- **No voice, no attachments** in v1

### Live classes (MVP)
- Admin creates a live class (title, date/time, mentor, program, meeting/YouTube link)
- Student sees upcoming classes
- "Join" opens the link
- No attendance tracking, no calendar integration

### Mock tests (MVP)
- Admin creates a basic MCQ test
- Student attempts it
- Score shown after submit

### Community (MVP)
- **Static community CTA** linking to a Facebook/WhatsApp group + a simple announcements page.
- (Full forum is Phase 2.)

### Manual bKash payment (replaces all payment gateways)
See **Section 10** for the full flow.

---

## 4. What we are intentionally CUTTING for v1

These were in the original enterprise plan. For 200–300 users they add cost, risk, and complexity with no immediate return. **Do not build these now:**

- ❌ SSLCommerz integration
- ❌ Stripe / international cards / Apple Pay / Google Pay
- ❌ Automatic payment gateway callbacks & IPN validation
- ❌ Payment webhooks
- ❌ Automatic invoice generation
- ❌ Automatic certificate PDF generation
- ❌ Full realtime notifications (bell with live push)
- ❌ PWA / service worker / offline mode
- ❌ Sentry error monitoring
- ❌ Plausible / GA4 analytics (optional, skip for launch)
- ❌ Mentor earnings / wallet system
- ❌ Complex multi-item cart (unless truly needed)
- ❌ Full realtime community forum with live comments
- ❌ Voice recording for Ask-a-Mentor
- ❌ Image/PDF attachment pipeline for Ask-a-Mentor
- ❌ Phone OTP login (adds friction & cost)
- ❌ Cloudinary (use Supabase Storage instead — one less service to manage)
- ❌ `next-intl` full runtime i18n machinery (we prepare Bangla-ready keys, but keep it light)
- ❌ Cmd+K global instant search (use simple DB filter/search instead)
- ❌ Too many dashboard widgets
- ❌ Too many routes before launch

> **Why cutting matters:** every extra service is another API key, another failure point, another thing you must debug at 2 AM before launch. Ship the mentorship core first.

---

## 5. What MOVES to Phase 2 (after launch is stable)

Keep the database **future-proof** so these slot in later without a rewrite:

| Phase 2 feature | Why it waits |
|---|---|
| SSLCommerz / Stripe automatic payments | Manual bKash is enough to validate demand first |
| Automatic invoices & receipts | Nice-to-have; email a PDF manually if needed |
| Certificate PDF generation & public verify page | Postpone; issue certificates manually first |
| Mock test leaderboard + analytics | Core MCQ attempt is enough for v1 |
| Full community forum + realtime comments | Start with a Facebook/WhatsApp group link |
| Realtime notifications (live bell) | In-dashboard status badges are enough |
| Voice questions + attachments in Ask-a-Mentor | Text answers real needs first |
| Mentor dashboard + mentor earnings | Admin manages mentors initially |
| Phone OTP login | Email + Google is enough |
| PWA / offline | Not needed at this scale |
| Cmd+K instant search | Simple filter search is fine |
| Booking calendar / availability | Use Ask-a-Mentor + live classes first |

---

## 6. Simplified 30,000-ft mind map

```
MCA MVP
│
├── PHASE 0 — Accounts & setup (Day 1)
│   ├── GitHub repo (private)
│   ├── Supabase project (region: Singapore/Mumbai) → URL + anon + service_role
│   ├── Vercel project (import the repo)
│   ├── Node.js LTS + Claude Code in VS Code terminal
│   └── .env.local created (never committed)
│
├── PHASE 1 — Foundation (Day 2–3)
│   ├── Next.js 15 (App Router, TS strict)
│   ├── Tailwind v4 tokens + shadcn/ui
│   ├── Layout: Liquid-Glass Navbar + Footer + Theme toggle
│   └── Bangla-ready text keys (light-touch)
│
├── PHASE 2 — Database & Auth (Day 4–5)
│   ├── Supabase schema (MVP tables) + RLS ON everywhere
│   ├── profiles auto-created via trigger on signup
│   └── Email/password (+ optional Google) auth
│
├── PHASE 3 — Public site (Day 6–9)
│   ├── Home, Programs (+detail), Mentors (+detail)
│   ├── E-books/Resources, Blog, About, Contact
│   └── Basic SEO metadata + sitemap + robots
│
├── PHASE 4 — Commerce = MANUAL bKash (Day 10–11)
│   ├── Checkout page shows bKash number + instructions
│   ├── Student submits sender number + trx id + amount
│   └── Order = pending_verification
│
├── PHASE 5 — Student area (Day 12–13)
│   ├── Dashboard: my programs, my e-books, my orders
│   ├── Ask-a-Mentor (text) + status
│   └── Profile edit
│
├── PHASE 6 — Admin panel (Day 14–16)
│   ├── Approve/Reject payments → grant access
│   ├── CRUD: mentors, programs, lessons, e-books, blog
│   └── Answer questions, manage users
│
├── PHASE 7 — Learning + extras (Day 17–18)
│   ├── Enrolled content page (YouTube lessons)
│   ├── Live classes (link only)
│   └── Simple MCQ mock tests
│
└── PHASE 8 — Launch (Day 19–20)
    ├── Seed data, responsive QA, a11y pass
    ├── Deploy to Vercel + env vars
    └── Handover notes for the client
```

---

## 7. MVP user flows

### Student — enrol in a paid program (manual bKash)
```
Browse Programs → open Program detail → click "Enrol"
→ (must be logged in; if not → Login/Register)
→ Checkout page shows: amount + bKash number + instructions
→ Student sends money in bKash app (outside the site)
→ Student fills: sender number, transaction ID, amount (+ optional screenshot)
→ Order created with status "pending_verification"
→ Student sees "Waiting for admin approval" in dashboard
→ Admin approves → status "paid" → enrollment created → content unlocks
   OR Admin rejects → status "rejected" + reason → student can resubmit
```

### Student — Ask a Mentor
```
Dashboard → "Ask a Mentor" → type question (+ optional program tag)
→ Question created, status "waiting"
→ Admin/mentor replies from panel → status "answered"
→ Student sees the answer in dashboard
```

### Admin — verify a payment
```
Admin panel → Payment requests (pending_verification)
→ Open request → check trx id in real bKash → Approve or Reject
→ Approve: order=paid, enrollment/access granted, submission=approved
→ Reject: submission=rejected, order=rejected/pending, admin note saved
```

### Admin — publish a program
```
Admin → Programs → New → fill title, mentor, price, description, cover
→ Add modules + lessons (YouTube embed URLs)
→ Set status = published → appears on public site
```

---

## 8. Simplified tech stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router, TypeScript strict)** | Server Components by default |
| Styling | **Tailwind CSS v4** | `@theme` tokens in `globals.css` |
| UI primitives | **shadcn/ui + Radix UI** | Accessible dialog/dropdown/tabs |
| Icons | **lucide-react** | Clean, Apple-ish |
| Forms | **react-hook-form + zod** | Type-safe validation |
| Animation | **Framer Motion** | Subtle only (250–300ms) |
| Database + Auth + Storage | **Supabase (Postgres, Auth, Storage, RLS)** | One backend for everything |
| File storage | **Supabase Storage** | Private buckets + signed URLs |
| Email (optional) | **Resend** | Only for contact/admin email, if easy |
| Hosting | **Vercel** | Auto-deploy from GitHub |
| Repo | **GitHub** | Private |
| IDE / Assistant | **Claude Code in VS Code terminal** | Paste chunks from file 2 |

**Removed from the original stack for MVP:** Cloudinary, SSLCommerz, Stripe, next-intl runtime, Sentry, Plausible/GA4, next-pwa, zustand cart (unless needed), @react-pdf/renderer.

> **Storage rule (simple):** all uploaded/private files (e-book PDFs, payment screenshots) go to **Supabase Storage private buckets** and are served via **signed URLs**. Public marketing images can also live in Supabase Storage (public bucket) — no separate image CDN needed at this scale.

---

## 9. Simplified database model

Design for the MVP, but keep it **future-proof** (so SSLCommerz, Stripe, more roles, and automation slot in later without a rewrite). This is not a toy DB — just a lean one.

### Core MVP tables
- `profiles` — extends `auth.users` (role: student/mentor/admin)
- `mentors` — mentor details (1-1 with a profile where role=mentor)
- `categories` — program categories
- `programs` — courses/programs
- `modules` — sections inside a program
- `lessons` — lessons (YouTube URL + text)
- `enrollments` — who has access to which program
- `resources` — e-books & downloadable resources (unified table)
- `orders` — one order per purchase attempt
- `order_items` — items inside an order
- `manual_payment_submissions` — the bKash proof a student submits
- `questions` — Ask-a-Mentor questions
- `answers` — mentor/admin replies
- `live_classes` — live class entries (link only)
- `blog_posts` — blog content
- `contact_messages` — contact form submissions
- `payment_settings` — admin-editable bKash numbers & instructions

### Optional simple tables
- `lesson_progress` — simple "mark complete"
- `bookmarks` — save-for-later
- `mock_tests`, `mock_questions`, `test_attempts` — basic MCQ engine

### Intentionally postponed tables (Phase 2)
`certificates`, `payments` (gateway/webhook table), SSLCommerz-specific tables, mock-test analytics, realtime `notifications`, `community_posts`/`community_comments`, `sessions` (booking calendar).

### `orders` — required fields
```
id, user_id, total_bdt,
status: pending_payment | pending_verification | paid | rejected | cancelled,
created_at, updated_at
```

### `manual_payment_submissions` — required fields
```
id, order_id, user_id,
method: 'bkash',
sender_number, transaction_id, paid_amount_bdt,
screenshot_path (optional),
status: submitted | approved | rejected,
admin_note (optional), reviewed_by (optional), reviewed_at (optional),
created_at
```

**On admin APPROVE:** order → `paid`, create enrollment / grant resource access, submission → `approved`.
**On admin REJECT:** submission → `rejected`, order → `rejected` (or keep `pending` for better UX), save `admin_note`.

> The full copy-paste SQL schema, RLS policies, and seed data live in **Chunk 03** of `02_MCA_Claude_Code_Prompts.md` and its Appendix.

---

## 10. Manual bKash payment flow (the whole thing)

Because we removed all automatic gateways, payment is a **human-verified manual flow**. This is completely normal and trusted in Bangladesh.

```
1. Admin sets one or more bKash numbers + instructions in Admin → Payment Settings.
2. Student selects a program / e-book / session and clicks Enrol / Buy.
3. Checkout page shows:
     - order summary + total amount (BDT)
     - the bKash number(s)
     - clear instructions ("Send Money", not "Payment")
4. Student opens bKash app and sends money manually.
5. Student returns and fills the form:
     - sender bKash number
     - transaction ID
     - paid amount
     - optional screenshot upload (Supabase Storage, if simple)
6. System creates an order → status "pending_verification".
7. Admin sees the request in Admin → Payment Requests.
8. Admin manually checks the transaction in their bKash statement.
9. Admin clicks:
     ✅ Approve → order "paid", enrollment/access granted, student notified in dashboard
     ❌ Reject  → order "rejected", admin note saved, student sees reason & can resubmit
```

**Security rules (critical):**
- A student can **never** approve their own payment.
- Approval logic runs **only** in a Server Action / Route Handler, gated to `admin`.
- Access to protected content requires an **approved** enrollment.

---

## 11. Folder structure

```
mca/
├─ .env.local               # secrets — NEVER commit
├─ .env.example             # committed, no real values
├─ next.config.ts
├─ tsconfig.json
├─ package.json
├─ middleware.ts            # auth + role gating
├─ public/                  # static assets, favicon, og image
├─ supabase/
│  ├─ schema.sql            # MVP schema (Chunk 03)
│  ├─ policies.sql          # RLS policies (Chunk 03)
│  └─ seed.sql              # demo data
└─ src/
   ├─ app/
   │  ├─ (marketing)/       # public pages
   │  │  ├─ page.tsx        # home
   │  │  ├─ programs/       # list + [slug]
   │  │  ├─ mentors/        # list + [id]
   │  │  ├─ resources/      # e-books & resources list + [slug]
   │  │  ├─ live-classes/
   │  │  ├─ mock-tests/
   │  │  ├─ blog/           # list + [slug]
   │  │  ├─ about/page.tsx
   │  │  └─ contact/page.tsx
   │  ├─ (auth)/
   │  │  ├─ login/
   │  │  ├─ register/
   │  │  └─ forgot-password/
   │  ├─ checkout/          # manual bKash checkout
   │  ├─ dashboard/         # student area (protected)
   │  ├─ admin/             # admin area (protected)
   │  ├─ layout.tsx
   │  └─ not-found.tsx
   ├─ components/
   │  ├─ ui/                # shadcn primitives
   │  ├─ marketing/         # Hero, MentorCard, ProgramCard, …
   │  ├─ dashboard/
   │  ├─ admin/
   │  └─ shared/            # Navbar, Footer, ThemeToggle, Logo
   ├─ features/             # feature logic (server actions, queries)
   │  ├─ auth/
   │  ├─ programs/
   │  ├─ mentors/
   │  ├─ resources/
   │  ├─ questions/         # Ask-a-Mentor
   │  ├─ payments/          # manual bKash
   │  ├─ live-classes/
   │  ├─ mock-tests/
   │  └─ blog/
   ├─ lib/
   │  ├─ supabase/          # server.ts, browser.ts, admin.ts
   │  ├─ utils.ts
   │  ├─ motion.ts
   │  └─ constants.ts
   ├─ styles/globals.css    # Tailwind v4 + @theme tokens
   └─ types/database.types.ts
```

---

## 12. Design system (keep the premium MCA feel)

**Light theme (default)**
- Background `#FAFAF8` (Cream White)
- Surface `#FFFFFF`
- Text (primary) `#0F172A`
- Text (muted) `#64748B`
- Border `#E5E7EB`

**Dark theme (prepared, not over-engineered)**
- Background `#0B1220`
- Surface `#111827`
- Text `#F8FAFC`
- Border `#1F2937`

**Brand colors**
- Primary `#0F172A` (Deep Navy)
- Accent `#0F766E` (Emerald)
- Accent hover `#14B8A6`
- Success `#22C55E`
- Warning `#F59E0B`
- Danger `#EF4444`

**Typography**
- English: `Inter`
- বাংলা: `Hind Siliguri` or `Noto Sans Bengali`
- Scale: Display 56/64 · H1 40/48 · H2 32/40 · H3 24/32 · Body 16/26 · Small 14/20

**Radius:** sm 8 · md 12 · lg 16 · xl 24 (cards default `xl`).
**Shadow:** soft `0 4px 24px rgba(15,23,42,0.06)`.
**Motion:** 250–300ms, ease `[0.22, 1, 0.36, 1]`. Fade + slight scale/slide only. No bounce, no flashy effects.
**Glass:** only the **navbar** uses the Apple Liquid-Glass blur. Every other section stays clean.
**Grid:** max container ~1280px, mobile-first, breakpoints sm 640 · md 768 · lg 1024 · xl 1280.

---

## 13. Roles & permissions (RLS at a glance)

| Role | Sees | Can create | Can edit |
|---|---|---|---|
| **Guest** | Public pages, previews | — | — |
| **Student** | Own dashboard, enrolled content, own questions/orders | Questions, orders, payment submissions, bookmarks | Own profile |
| **Mentor** | Own programs, assigned questions | Answers (Phase 2: program edits) | Own profile |
| **Admin** | Everything | Everything | Everything |

Implementation: `profiles.role` enum (`student`/`mentor`/`admin`) + an `is_admin()` SQL helper + RLS policies on **every** table.

> ⚠️ For MVP, mentors are **managed by the admin**. A full mentor dashboard is Phase 2. Answers to questions can be posted by admin (acting on behalf of mentors) in v1.

---

## 14. Development phases (what order to build)

1. **Setup** — accounts, repo, env (Chunk 00–01)
2. **Design system + layout** (Chunk 02)
3. **Database + RLS** (Chunk 03) ⭐ most important
4. **Supabase clients + auth** (Chunk 04–05)
5. **Public marketing pages** (Chunk 06)
6. **Programs / mentors / resources** (Chunk 07)
7. **Manual bKash payment** (Chunk 08)
8. **Student dashboard** (Chunk 09)
9. **Admin dashboard shell** (Chunk 10)
10. **Admin CRUD** (Chunk 11)
11. **Ask-a-Mentor** (Chunk 12)
12. **Learning delivery** (Chunk 13)
13. **Live classes + mock tests** (Chunk 14)
14. **Blog / contact / community CTA polish** (Chunk 15)
15. **SEO / responsive / a11y / seed** (Chunk 16)
16. **Deploy to Vercel** (Chunk 17)

---

## 15. Launch checklist (Definition of Done)

- ✅ Every route renders with no console errors
- ✅ Both themes look correct on every page
- ✅ Bangla-ready text keys work; no layout breaks with Bangla font
- ✅ Student can: register → log in → open a program → checkout → submit bKash payment → see "pending"
- ✅ Admin can: see payment request → approve → student gets enrollment → content unlocks
- ✅ Admin can: reject a payment with a reason → student sees reason → can resubmit
- ✅ Student can: ask a text question → admin answers → student sees the answer
- ✅ Admin can: create a program with YouTube lessons → publish → it appears publicly
- ✅ Contact form saves to `contact_messages`
- ✅ RLS is **ON** for every table; a logged-out user cannot read private data
- ✅ `.env.local` is **not** committed; service role key is server-only
- ✅ Vercel production build is green
- ✅ Both markdown docs are committed in `/docs`

---

## 16. Beginner workflow — using Claude Code in the VS Code terminal

1. Open your project folder in **VS Code**.
2. Open a **terminal** (`Ctrl + `` `) and run `claude` to start Claude Code (or use the extension).
3. Open `02_MCA_Claude_Code_Prompts.md`.
4. **Paste the Global Rules once** at the very start (top of file 2).
5. Copy **one chunk at a time** into Claude Code. Let it finish.
6. **Read what it changed** in the file tree — don't blindly accept.
7. Run `npm run dev` and open `http://localhost:3000`. Fix errors before moving on.
8. Run the chunk's **acceptance checklist**.
9. Commit with the suggested message: `git add . && git commit -m "..."`.
10. Push to GitHub. Vercel auto-deploys a preview — click it and check visually.
11. Only then move to the next chunk.

**When Claude Code breaks something:**
- Say: *"Revert your last change and redo it, but keep file X untouched."*
- Or use git: `git restore .` then re-prompt with tighter constraints.

---

## 17. Common mistakes to avoid

1. **Don't** put the Supabase `service_role` key in any client component. Server-only, always.
2. **Don't** commit `.env.local`. Confirm it is in `.gitignore` from day one.
3. **Don't** skip RLS. Turn it **on** for every table before writing a single query.
4. **Don't** let a student approve their own payment. Approval = admin-only server action.
5. **Don't** serve gated files with public URLs. Use Supabase Storage **signed URLs**.
6. **Don't** hand-write `<button>` everywhere. Use one `<Button/>` component — consistency = premium feel.
7. **Don't** animate everything. Apple-style = restraint: fade + slight scale + soft shadow.
8. **Don't** forget Bangla typography — test headings with real Bangla text.
9. **Don't** add features from the "cut" list to look impressive. Ship the core, launch, then iterate.
10. **Don't** paste two chunks at once. One chunk → verify → commit → next.

---

## 18. Future scaling roadmap (after 200–300 users work)

**Phase 2 (grow):**
- Add SSLCommerz (automatic bKash/Nagad/Rocket/cards) alongside manual bKash.
- Mentor dashboard + assign questions to specific mentors.
- Voice + attachments in Ask-a-Mentor.
- Certificate PDF generation + public verification page.
- Mock test leaderboard + analytics.
- Realtime notifications (Supabase Realtime).

**Phase 3 (scale):**
- Stripe for international students.
- Full community forum with comments.
- Booking calendar & mentor availability.
- PWA / offline, analytics (Plausible), Sentry monitoring.
- Cmd+K global search.
- Mentor earnings / payout system.

Because the MVP database was designed to be future-proof, each of these is an **addition**, not a rewrite.

---

## 19. Next step

Open **`02_MCA_Claude_Code_Prompts.md`** and start with **Chunk 00 (Global Rules + prerequisites)**.
