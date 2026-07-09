-- ============================================================
-- MCA MVP — Row Level Security policies
-- Run AFTER schema.sql, BEFORE seed.sql.
-- ============================================================

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
-- Mentor profiles are part of the public mentor directory (name, photo, bio).
create policy "profiles: public read mentors" on public.profiles for select
  using (role = 'mentor');
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
-- NOTE: no student UPDATE policy -> a student can NEVER change status to approved.

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
