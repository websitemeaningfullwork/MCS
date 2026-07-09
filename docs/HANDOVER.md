# MCA — Handover & Operations Guide

The Meaningful Career Academy MVP is built and deployed. This document is the
practical guide to running it.

- **Live site:** https://mcs-pi.vercel.app
- **Repo:** https://github.com/websitemeaningfullwork/MCS
- **Hosting:** Vercel (auto-deploys on every push to `main`)
- **Backend:** Supabase (Postgres + Auth + Storage + RLS)

---

## 1. Logging in as admin

Admin email: `websitemeaningfulwork@gmail.com`

The admin panel is at **/admin**. From there you control everything:

| Task | Where |
|---|---|
| Approve / reject a student's bKash payment | Admin → Payment Requests |
| Set the bKash number & instructions | Admin → Payment Settings |
| Add / edit mentors | Admin → Mentors |
| Create programs + lessons (YouTube) | Admin → Programs |
| Upload e-books / resources | Admin → Resources |
| Write blog posts | Admin → Blog |
| Schedule live classes | Admin → Live Classes |
| Build mock tests + questions | Admin → Mock Tests |
| Answer student questions | Admin → Questions |
| Change a user's role | Admin → Users |

> To make another person an admin: Admin → Users → set their role to **Admin**.

---

## 2. The payment flow (manual bKash)

1. Student enrols → checkout shows the bKash number (from Payment Settings).
2. Student sends money in bKash, then submits sender number + transaction ID
   (+ optional screenshot).
3. The order appears in **Admin → Payment Requests** as *Pending*.
4. Admin checks the transaction in their real bKash, then **Approve** (unlocks
   access) or **Reject** (student sees the reason and can resubmit).

Security: a student can **never** approve their own payment — approval only
happens in an admin-gated server action.

---

## 3. Environment variables (set in Vercel → Settings → Environment Variables)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The production URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only, never `NEXT_PUBLIC_` |

`.env.local` (same keys) is used for local development and is git-ignored.

---

## 4. Database schema & migrations

- Base schema: `supabase/schema.sql` → `policies.sql` → `seed.sql`
  (run once in the Supabase SQL editor, in that order).
- Incremental changes live in `supabase/migrations/` and have been applied:
  - `001` public mentor profiles
  - `002` fix `is_admin()` RLS recursion (SECURITY DEFINER)
  - `003` storage buckets (payment-screenshots, avatars)
  - `004` resource-files bucket

Row Level Security is **ON for every table**.

---

## 5. Before public launch (important)

- [ ] **Rotate secrets** that were shared during development: Supabase
      `service_role` key (Settings → API) and the database password
      (Settings → Database). Update the new `service_role` key in Vercel.
- [ ] Set the **real bKash number** in Admin → Payment Settings.
- [ ] Replace placeholder **community links** (Facebook / WhatsApp) in
      `src/lib/constants.ts`.
- [ ] Turn email confirmation back **on** in Supabase → Authentication (if you
      turned it off for testing).
- [ ] Replace the 3 demo mentors / seed content with real content as needed.

---

## 6. What's intentionally deferred (Phase 2)

SSLCommerz/Stripe automatic payments, certificate PDFs, mock-test leaderboards,
realtime notifications, a full community forum, voice/attachments in
Ask-a-Mentor, mentor dashboards, and PWA/analytics. The database was designed so
these slot in later as additions, not rewrites.

---

## 7. Everyday developer workflow

```bash
npm install        # once
npm run dev        # local dev at http://localhost:3000
npm run build      # production build check
```

Push to `main` → Vercel auto-deploys. That's it.
