-- ============================================================
-- Migration 000 — base schema + RLS (single source of truth)
--
-- This is the FIRST migration. It creates every extension, enum, table,
-- trigger, helper function, and the row-level-security policies.
-- Migrations 001–007 then patch on top, in order. Always run the full set
-- (000 → 007).
--
-- Forward-safe: the policies that migrations 006/007 tighten are baked into this
-- file in their HARDENED form (or intentionally left dropped-not-recreated), so
-- re-running 000 on an already-migrated database no longer re-opens the P0/P1
-- holes that 006/007 closed. Every statement is guarded / uses `if not exists`.
--
-- Supersedes the standalone supabase/schema.sql + supabase/policies.sql, which
-- are kept only for reference.
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums (guarded so re-runs don't error)
-- ------------------------------------------------------------
do $$ begin create type user_role          as enum ('student','mentor','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type program_level      as enum ('beginner','intermediate','advanced','all_levels'); exception when duplicate_object then null; end $$;
do $$ begin create type program_status     as enum ('draft','published','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type question_status    as enum ('waiting','answered','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type question_visibility as enum ('private','community'); exception when duplicate_object then null; end $$;
do $$ begin create type resource_kind      as enum ('ebook','cv_template','roadmap','interview','productivity','scholarship','other'); exception when duplicate_object then null; end $$;
do $$ begin create type order_status       as enum ('pending_payment','pending_verification','paid','rejected','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type submission_status  as enum ('submitted','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type post_status        as enum ('draft','published'); exception when duplicate_object then null; end $$;
do $$ begin create type test_type          as enum ('topic','practice','full'); exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------
create table if not exists public.profiles (
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

create table if not exists public.mentors (
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

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_bn text,
  icon text,
  sort_order int default 0
);

create table if not exists public.programs (
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
create index if not exists programs_status_idx      on public.programs(status);
create index if not exists programs_category_id_idx  on public.programs(category_id);
create index if not exists programs_mentor_id_idx     on public.programs(mentor_id);

create table if not exists public.modules (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references public.programs(id) on delete cascade,
  title text not null,
  sort_order int default 0
);
create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  video_url text,
  content_md text,
  duration_seconds int,
  is_preview boolean default false,
  sort_order int default 0
);

create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  progress numeric(5,2) default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, program_id)
);
create table if not exists public.lesson_progress (
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  is_completed boolean default false,
  seconds_watched int default 0,
  notes text,
  updated_at timestamptz default now(),
  primary key(user_id, lesson_id)
);

create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  author text,
  kind resource_kind not null default 'ebook',
  cover_url text,
  description text,
  price_bdt numeric(10,2) not null default 0,
  file_storage_path text,
  sample_storage_path text,
  external_url text,
  pages int,
  is_featured boolean default false,
  is_premium boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.resource_access (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  order_id uuid,
  created_at timestamptz default now(),
  unique(user_id, resource_id)
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  total_bdt numeric(10,2) not null,
  status order_status default 'pending_verification',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  item_type text check (item_type in ('program','resource')),
  item_id uuid not null,
  title text,
  price_bdt numeric(10,2) not null,
  quantity int default 1
);
create table if not exists public.manual_payment_submissions (
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

create table if not exists public.questions (
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
create table if not exists public.answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.live_classes (
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

create table if not exists public.mock_tests (
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
create table if not exists public.mock_questions (
  id uuid primary key default uuid_generate_v4(),
  mock_test_id uuid references public.mock_tests(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_key text not null,
  marks int default 1,
  explanation text,
  sort_order int default 0
);
create table if not exists public.test_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  mock_test_id uuid references public.mock_tests(id) on delete cascade,
  score int,
  total int,
  answers jsonb,
  started_at timestamptz default now(),
  submitted_at timestamptz
);

create table if not exists public.blog_posts (
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

create table if not exists public.bookmarks (
  user_id uuid references public.profiles(id) on delete cascade,
  item_type text,
  item_id uuid,
  created_at timestamptz default now(),
  primary key(user_id, item_type, item_id)
);
create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text, email text, subject text, body text,
  created_at timestamptz default now()
);
create table if not exists public.payment_settings (
  id uuid primary key default uuid_generate_v4(),
  label text default 'bKash',
  bkash_number text not null,
  instructions text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Trigger: auto-create a profile on signup
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Helper: is_admin() (SECURITY DEFINER — avoids RLS recursion)
-- ------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role='admin' from public.profiles where id = auth.uid()), false)
$$;

-- ------------------------------------------------------------
-- Enable RLS on every table (no-op if already enabled)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Policies (each dropped-if-exists first so this file is idempotent).
-- NOTE: some of these are intentionally tightened/removed by migration 006.
-- ------------------------------------------------------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin"  on public.profiles for select
  using (auth.uid() = id or public.is_admin());
-- Superseded by migration 006 (P1 #5): public mentor reads go through the
-- column-safe public_mentor_profiles view, never the base `profiles` table
-- (which exposes email/phone). Intentionally NOT recreated here; the drop stays
-- so re-running 000 removes any legacy copy instead of re-opening the leak.
drop policy if exists "profiles: public read mentors" on public.profiles;
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "mentors: public read" on public.mentors;
create policy "mentors: public read"  on public.mentors for select using (true);
drop policy if exists "mentors: admin write" on public.mentors;
create policy "mentors: admin write"  on public.mentors for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories for select using (true);
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "programs: read published or admin" on public.programs;
create policy "programs: read published or admin" on public.programs for select
  using (status='published' or public.is_admin());
drop policy if exists "programs: admin write" on public.programs;
create policy "programs: admin write" on public.programs for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "modules: read via program" on public.modules;
create policy "modules: read via program" on public.modules for select
  using (exists(select 1 from public.programs p where p.id=program_id
                and (p.status='published' or public.is_admin())));
drop policy if exists "modules: admin write" on public.modules;
create policy "modules: admin write" on public.modules for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons: read preview/enrolled/admin" on public.lessons;
create policy "lessons: read preview/enrolled/admin" on public.lessons for select
  using (
    is_preview = true
    or public.is_admin()
    or exists(select 1 from public.enrollments e
              join public.modules m on m.id = lessons.module_id
              where e.user_id = auth.uid() and e.program_id = m.program_id)
  );
drop policy if exists "lessons: admin write" on public.lessons;
create policy "lessons: admin write" on public.lessons for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enrollments: own or admin" on public.enrollments;
create policy "enrollments: own or admin" on public.enrollments for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "enrollments: admin write" on public.enrollments;
create policy "enrollments: admin write" on public.enrollments for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lesson_progress: own" on public.lesson_progress;
create policy "lesson_progress: own" on public.lesson_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Superseded by migration 006: public resource reads go through the column-safe
-- public_resources view (which hides file_storage_path and unpublished rows).
-- Intentionally NOT recreated here; the drop stays so re-running 000 removes any
-- legacy copy instead of re-exposing the base table.
drop policy if exists "resources: public read" on public.resources;
drop policy if exists "resources: admin write" on public.resources;
create policy "resources: admin write" on public.resources for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "resource_access: own or admin" on public.resource_access;
create policy "resource_access: own or admin" on public.resource_access for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "resource_access: admin write" on public.resource_access;
create policy "resource_access: admin write" on public.resource_access for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders: own or admin read" on public.orders;
create policy "orders: own or admin read" on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
-- Superseded by migration 006 (P0 #3): orders are created ONLY server-side via
-- the service role so clients can't craft self-priced order rows. Student INSERT
-- intentionally NOT recreated; the drop stays to remove any legacy copy.
drop policy if exists "orders: student insert own" on public.orders;
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items: own or admin read" on public.order_items;
create policy "order_items: own or admin read" on public.order_items for select
  using (exists(select 1 from public.orders o where o.id=order_id
                and (o.user_id = auth.uid() or public.is_admin())));
-- Superseded by migration 006 (P0 #3): order items are written only server-side
-- via the service role. Student INSERT intentionally NOT recreated.
drop policy if exists "order_items: student insert own" on public.order_items;
drop policy if exists "order_items: admin write" on public.order_items;
create policy "order_items: admin write" on public.order_items for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mps: own or admin read" on public.manual_payment_submissions;
create policy "mps: own or admin read" on public.manual_payment_submissions for select
  using (user_id = auth.uid() or public.is_admin());
-- Superseded by migration 006 (P0 #3): manual payment submissions are written
-- only server-side via the service role. Student INSERT intentionally NOT recreated.
drop policy if exists "mps: student insert own" on public.manual_payment_submissions;
drop policy if exists "mps: admin update" on public.manual_payment_submissions;
create policy "mps: admin update" on public.manual_payment_submissions for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "questions: read own/community/admin" on public.questions;
create policy "questions: read own/community/admin" on public.questions for select
  using (student_id = auth.uid() or visibility = 'community' or public.is_admin());
drop policy if exists "questions: student insert own" on public.questions;
create policy "questions: student insert own" on public.questions for insert
  with check (student_id = auth.uid());
drop policy if exists "questions: owner/admin update" on public.questions;
create policy "questions: owner/admin update" on public.questions for update
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "answers: read via question" on public.answers;
create policy "answers: read via question" on public.answers for select
  using (exists(select 1 from public.questions q where q.id = question_id
                and (q.student_id = auth.uid() or q.visibility='community' or public.is_admin())));
-- Hardened form baked in from migration 007 (P1): an answer INSERT must be tied
-- to a question the caller may actually participate in — not merely author_id =
-- auth.uid(), which let any authenticated user inject replies onto any question.
drop policy if exists "answers: auth insert" on public.answers;
create policy "answers: auth insert" on public.answers for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.student_id = auth.uid()
          or q.mentor_id = auth.uid()
          or q.visibility = 'community'
          or public.is_admin()
        )
    )
  );

drop policy if exists "live: public read" on public.live_classes;
create policy "live: public read" on public.live_classes for select
  using (is_public = true or public.is_admin());
drop policy if exists "live: admin write" on public.live_classes;
create policy "live: admin write" on public.live_classes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mocks: public read" on public.mock_tests;
create policy "mocks: public read" on public.mock_tests for select using (true);
drop policy if exists "mocks: admin write" on public.mock_tests;
create policy "mocks: admin write" on public.mock_tests for all
  using (public.is_admin()) with check (public.is_admin());
-- Superseded by migration 006 (P0 #4): the base read exposed correct_key. Public
-- reads go through the sanitized public_mock_questions view; scoring reads keys
-- only via the service role. Intentionally NOT recreated; the drop stays.
drop policy if exists "mockq: read via test" on public.mock_questions;
drop policy if exists "mockq: admin write" on public.mock_questions;
create policy "mockq: admin write" on public.mock_questions for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "attempts: own" on public.test_attempts;
create policy "attempts: own" on public.test_attempts for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

drop policy if exists "blog: read published or admin" on public.blog_posts;
create policy "blog: read published or admin" on public.blog_posts for select
  using (status = 'published' or author_id = auth.uid() or public.is_admin());
drop policy if exists "blog: admin/author write" on public.blog_posts;
create policy "blog: admin/author write" on public.blog_posts for all
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "bookmarks: own" on public.bookmarks;
create policy "bookmarks: own" on public.bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "contact: anyone insert" on public.contact_messages;
create policy "contact: anyone insert" on public.contact_messages for insert with check (true);
drop policy if exists "contact: admin read" on public.contact_messages;
create policy "contact: admin read"    on public.contact_messages for select using (public.is_admin());

drop policy if exists "psettings: public read" on public.payment_settings;
create policy "psettings: public read" on public.payment_settings for select using (true);
drop policy if exists "psettings: admin write" on public.payment_settings;
create policy "psettings: admin write" on public.payment_settings for all
  using (public.is_admin()) with check (public.is_admin());
