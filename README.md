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

SQL for Supabase lives in [`/supabase`](./supabase): `schema.sql`, `policies.sql`, `seed.sql`.
Run them in the Supabase SQL editor in that order (schema → policies → seed).
