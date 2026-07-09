-- ============================================================
-- MCA MVP — schema (extensions, enums, tables, trigger, helpers)
-- Run this FIRST, then policies.sql, then seed.sql.
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type user_role          as enum ('student','mentor','admin');
create type program_level      as enum ('beginner','intermediate','advanced','all_levels');
create type program_status     as enum ('draft','published','archived');
create type question_status     as enum ('waiting','answered','closed');
create type question_visibility as enum ('private','community');
create type resource_kind      as enum ('ebook','cv_template','roadmap','interview','productivity','scholarship','other');
create type order_status        as enum ('pending_payment','pending_verification','paid','rejected','cancelled');
create type submission_status   as enum ('submitted','approved','rejected');
create type post_status         as enum ('draft','published');
create type test_type           as enum ('topic','practice','full');

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
