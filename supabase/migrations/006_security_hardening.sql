-- ============================================================
-- Migration 006 — security hardening (production readiness audit)
-- Addresses P0 #1-4, P1 #5 & #7, P2 #13.
-- Safe to re-run (idempotent).
--
-- IMPORTANT: deploy this migration TOGETHER with the matching app code — it
-- restricts direct table reads that public pages used to rely on and routes
-- them through the new `public_*` views instead.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: is the current caller the service role? (bypasses column guards)
-- ------------------------------------------------------------
create or replace function public.is_service_role() returns boolean
language sql stable as $$
  select coalesce(auth.role() = 'service_role', false)
$$;

-- ============================================================
-- P0 #1 — profiles: block self-promotion to admin (and other system fields)
-- ============================================================
-- The "update own or admin" policy still lets a user edit their own row, but
-- direct API calls could change `role`, `email`, `id`, `created_at`. A trigger
-- enforces column-level protection for non-admin, non-service callers.
create or replace function public.protect_profiles_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.role       is distinct from old.role
     or new.email   is distinct from old.email
     or new.id      is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'Not allowed to modify protected profile fields';
  end if;
  return new;
end;$$;

drop trigger if exists trg_protect_profiles_columns on public.profiles;
create trigger trg_protect_profiles_columns
  before update on public.profiles
  for each row execute function public.protect_profiles_columns();

-- ============================================================
-- P0 #2 — mentors: block self-verify / self-feature / rating tampering
-- ============================================================
create or replace function public.protect_mentors_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.rating         is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.is_verified   is distinct from old.is_verified
     or new.is_featured   is distinct from old.is_featured then
    raise exception 'Not allowed to modify protected mentor fields';
  end if;
  return new;
end;$$;

drop trigger if exists trg_protect_mentors_columns on public.mentors;
create trigger trg_protect_mentors_columns
  before update on public.mentors
  for each row execute function public.protect_mentors_columns();

-- ============================================================
-- P0 #3 — commerce: orders/order_items/submissions are server-created only
-- ============================================================
-- Remove student INSERT policies. Checkout now runs through server-only code
-- (service role), which computes trusted prices; approval re-verifies totals.
drop policy if exists "orders: student insert own"      on public.orders;
drop policy if exists "order_items: student insert own"  on public.order_items;
drop policy if exists "mps: student insert own"          on public.manual_payment_submissions;

-- ============================================================
-- P0 #4 — mock_questions: answer keys must NOT be publicly readable
-- ============================================================
-- Drop the public read of the base table (it exposes correct_key). Admins keep
-- access via the existing "mockq: admin write" (FOR ALL) policy; scoring reads
-- the key through the service role.
drop policy if exists "mockq: read via test" on public.mock_questions;

-- Public/attempt view WITHOUT correct_key or explanation.
create or replace view public.public_mock_questions as
  select id, mock_test_id, question, options, marks, sort_order
  from public.mock_questions;
grant select on public.public_mock_questions to anon, authenticated;

-- ============================================================
-- P1 #5 — column-safe public views for mentor profiles and resources
-- ============================================================
-- Profiles: stop exposing full mentor rows (email, phone) to the public.
drop policy if exists "profiles: public read mentors" on public.profiles;

create or replace view public.public_mentor_profiles as
  select p.id, p.full_name, p.avatar_url, p.bio
  from public.profiles p
  where p.role = 'mentor';
grant select on public.public_mentor_profiles to anon, authenticated;

-- Resources: add a publish gate and stop exposing file_storage_path publicly.
alter table public.resources
  add column if not exists status text not null default 'published';
do $$ begin
  alter table public.resources
    add constraint resources_status_chk check (status in ('draft','published','archived'));
exception when duplicate_object then null; end $$;
create index if not exists resources_status_idx on public.resources(status);

-- Base table is no longer publicly readable; admins keep access via their
-- FOR ALL policy, owners/servers read through the view or the service role.
drop policy if exists "resources: public read" on public.resources;

create or replace view public.public_resources as
  select id, slug, title, author, kind, cover_url, description, price_bdt,
         external_url, pages, is_featured, is_premium, status, created_at
  from public.resources
  where status = 'published';
grant select on public.public_resources to anon, authenticated;

-- ============================================================
-- P1 #7 — storage bucket limits (size + MIME allowlists)
-- ============================================================
update storage.buckets
  set file_size_limit = 5 * 1024 * 1024,
      allowed_mime_types = array['image/png','image/jpeg','image/webp']
  where id in ('payment-screenshots', 'avatars');

update storage.buckets
  set file_size_limit = 25 * 1024 * 1024,
      allowed_mime_types = array['application/pdf','application/epub+zip','application/zip']
  where id = 'resource-files';

-- ============================================================
-- P2 #13 — data-integrity constraints and indexes
-- ============================================================
-- FK from resource_access.order_id to orders(id).
do $$ begin
  alter table public.resource_access
    add constraint resource_access_order_id_fkey
    foreign key (order_id) references public.orders(id) on delete set null;
exception when duplicate_object then null; end $$;

-- Prevent duplicate live payment submissions for the same transaction id
-- (rejected ones may legitimately be re-submitted).
create unique index if not exists mps_transaction_id_active_uidx
  on public.manual_payment_submissions (transaction_id)
  where status <> 'rejected';

-- Non-negative money / rating / count guards.
do $$ begin
  alter table public.programs add constraint programs_price_nonneg_chk check (price_bdt >= 0 and coalesce(discount_bdt,0) >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.resources add constraint resources_price_nonneg_chk check (price_bdt >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.orders add constraint orders_total_nonneg_chk check (total_bdt >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.manual_payment_submissions add constraint mps_amount_nonneg_chk check (paid_amount_bdt >= 0);
exception when duplicate_object then null; end $$;

-- Hot-path indexes for list/filter/RLS lookups.
create index if not exists order_items_order_id_idx           on public.order_items(order_id);
create index if not exists mps_user_status_order_idx          on public.manual_payment_submissions(user_id, status, order_id);
create index if not exists questions_student_status_idx       on public.questions(student_id, status);
create index if not exists questions_mentor_id_idx            on public.questions(mentor_id);
create index if not exists answers_question_id_idx            on public.answers(question_id);
create index if not exists mock_questions_test_id_idx         on public.mock_questions(mock_test_id);
create index if not exists lesson_progress_user_lesson_idx    on public.lesson_progress(user_id, lesson_id);
create index if not exists resource_access_user_id_idx        on public.resource_access(user_id);
create index if not exists enrollments_user_program_idx       on public.enrollments(user_id, program_id);
