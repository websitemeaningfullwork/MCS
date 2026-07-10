# Meaningful Career Academy (MCA)

A premium, mentorship-first educational platform for Bangladesh.

Mentorship is the heart of the product — programs, e-books, live classes, mock tests,
Ask-a-Mentor, career resources, and community all support the mentorship experience.

## Tech stack

- **Next.js 16** (App Router, TypeScript strict, React Server Components)
- **Tailwind CSS v4** (`@theme` tokens in `globals.css`)
- **shadcn/ui + Radix UI + lucide-react**
- **react-hook-form + zod** for forms
- **Framer Motion** for subtle animation
- **Supabase** (Postgres + Auth + Storage + RLS) — the only backend
- **Vercel** hosting, **GitHub** repo

Payment is a **manual bKash** flow verified by an admin (no automatic gateways in the MVP).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local env file and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**server only**) |
   | `RESEND_API_KEY` / `RESEND_FROM` | Optional — contact email only |

   > `.env.local` is git-ignored. The `SUPABASE_SERVICE_ROLE_KEY` must **never**
   > be prefixed with `NEXT_PUBLIC_` or imported into a client component.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project docs

Build plan and specification live in [`/docs`](./docs):

- `MCS main idea.md` — full brand & design specification
- `01_MCA_Roadmap_MindMap.md` — MVP roadmap / mind map
- `02_MCA_Claude_Code_Prompts.md` — chunk-by-chunk build prompts + SQL schema

## Database

`supabase/migrations/` is the **single source of truth** for the database. Apply
every migration in filename order (`000` → `008`) — either with the Supabase CLI:

```bash
supabase db push
```

…or by pasting each file into the Supabase SQL editor in order. `000_base_schema.sql`
creates all tables, RLS, and helpers; later migrations (`001`–`008`) patch on top.
All are idempotent (safe to re-run) — `000` bakes in the hardened `006`/`007` policy
set, so re-applying it no longer re-opens closed security holes. Always apply the
full set; don't stop at `000`.

Then optionally load demo data with `supabase/seed.sql`.

> `supabase/schema.sql` and `supabase/policies.sql` are the original standalone
> files, kept for reference only — they are fully reproduced by `000_base_schema.sql`.
