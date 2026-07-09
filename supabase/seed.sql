-- ============================================================
-- MCA MVP — seed data (run AFTER schema.sql and policies.sql)
-- Safe to re-run: uses ON CONFLICT / slug guards where possible.
--
-- NOTE: Mentors require real auth.users rows, so they are NOT seeded here.
-- Add mentors from the Admin panel after you create your admin account,
-- or run supabase/seed_mentors.sql (optional) if you want demo mentors.
-- Programs below have mentor_id = NULL until you assign a mentor.
-- ============================================================

-- ---------- Categories (10, per the mega-menu spec) ----------
insert into public.categories (slug, name, name_bn, icon, sort_order) values
  ('university-admission','University Admission','ভার্সিটি ভর্তি','graduation-cap',1),
  ('hsc','HSC','এইচএসসি','book-open',2),
  ('ssc','SSC','এসএসসি','book',3),
  ('programming','Programming','প্রোগ্রামিং','code',4),
  ('ai','AI','এআই','brain',5),
  ('english','English','ইংরেজি','languages',6),
  ('career-development','Career Development','ক্যারিয়ার','briefcase',7),
  ('productivity','Productivity','প্রোডাক্টিভিটি','zap',8),
  ('soft-skills','Soft Skills','সফট স্কিল','users',9),
  ('free-programs','Free Programs','ফ্রি প্রোগ্রাম','gift',10)
on conflict (slug) do nothing;

-- ---------- Payment settings (EDIT the number before launch) ----------
insert into public.payment_settings (label, bkash_number, instructions, is_active)
select 'bKash Personal', '01XXXXXXXXX',
       'Open bKash → Send Money to the number above → then submit your sender number, transaction ID, and amount below. We verify within 24 hours.',
       true
where not exists (select 1 from public.payment_settings);

-- ---------- Programs (6, published; 2 featured) ----------
insert into public.programs
  (slug, title, subtitle, description, category_id, price_bdt, discount_bdt, level,
   duration_minutes, learning_outcomes, requirements,
   is_featured, is_bestseller, is_trending, status, rating, reviews_count, enrolled_count)
values
  ('university-admission-crash','University Admission Crash Course',
   'Master admission tests with a structured, mentor-led plan.',
   'A complete, exam-focused program covering the full university admission syllabus with weekly guidance, practice, and doubt-solving from your mentor.',
   (select id from public.categories where slug='university-admission'),
   4500, 3500, 'all_levels', 1800,
   array['Cover the full admission syllabus','Master time management in exams','Solve 1000+ practice problems','Build a week-by-week study plan'],
   array['HSC-level basics','A device with internet'],
   true, true, true, 'published', 4.8, 126, 540),

  ('full-stack-web-development','Full-Stack Web Development',
   'Go from zero to deployed apps with modern JavaScript.',
   'Learn HTML, CSS, JavaScript, React, and Node with a mentor who reviews your projects and guides your first steps toward a developer career.',
   (select id from public.categories where slug='programming'),
   6000, 4800, 'beginner', 3600,
   array['Build responsive websites','Create full-stack apps with React & Node','Understand databases & APIs','Deploy real projects to the web'],
   array['Basic computer skills','No prior coding needed'],
   true, true, false, 'published', 4.9, 208, 812),

  ('practical-ai-for-students','Practical AI for Students',
   'Use AI tools to study smarter and build projects.',
   'A hands-on introduction to modern AI: prompting, building small AI apps, and using AI responsibly to accelerate your learning and work.',
   (select id from public.categories where slug='ai'),
   3500, 0, 'beginner', 1200,
   array['Understand how modern AI works','Write effective prompts','Build a simple AI-powered project','Use AI ethically & effectively'],
   array['Curiosity','A device with internet'],
   false, false, true, 'published', 4.7, 94, 371),

  ('spoken-english-confidence','Spoken English Confidence',
   'Speak English fluently and confidently.',
   'Break the fear of speaking. Daily practice, mentor feedback, and real conversation drills to build lasting confidence in English.',
   (select id from public.categories where slug='english'),
   3000, 2400, 'all_levels', 1500,
   array['Speak without hesitation','Expand practical vocabulary','Improve pronunciation','Handle interviews & presentations'],
   array['Basic English reading','Willingness to practice daily'],
   false, false, true, 'published', 4.6, 152, 489),

  ('career-launchpad','Career Launchpad',
   'Land your first job with a mentor by your side.',
   'CV building, LinkedIn, interview preparation, and a personalized career roadmap — everything you need to start your professional journey.',
   (select id from public.categories where slug='career-development'),
   4000, 3200, 'intermediate', 1400,
   array['Write a standout CV','Optimize your LinkedIn','Ace common interviews','Build a 90-day career plan'],
   array['Final-year student or graduate'],
   false, true, false, 'published', 4.8, 73, 260),

  ('productivity-mastery','Productivity Mastery',
   'Do more of what matters, with less stress.',
   'Learn proven systems for focus, planning, and habit-building so you can study and work with calm, consistent momentum.',
   (select id from public.categories where slug='productivity'),
   0, 0, 'all_levels', 600,
   array['Design a personal productivity system','Beat procrastination','Plan your week effectively','Build habits that stick'],
   array['None — great for everyone'],
   false, false, false, 'published', 4.5, 61, 703)
on conflict (slug) do nothing;

-- ---------- Modules: 2 per published program ----------
insert into public.modules (program_id, title, sort_order)
select p.id, m.title, m.sort_order
from public.programs p
cross join (values ('Getting Started', 1), ('Core Concepts', 2)) as m(title, sort_order)
where p.status = 'published'
  and not exists (select 1 from public.modules mo where mo.program_id = p.id);

-- ---------- Lessons: 3 per module (first lesson of module 1 is a free preview) ----------
insert into public.lessons (module_id, title, video_url, content_md, duration_seconds, is_preview, sort_order)
select mo.id,
       'Lesson ' || g.n,
       (array[
         'https://www.youtube.com/embed/rfscVS0vtbw',
         'https://www.youtube.com/embed/W6NZfCO5SIk',
         'https://www.youtube.com/embed/8jLOx1hD3_o'
       ])[g.n],
       E'## What you''ll learn\n\nThis lesson introduces the key ideas for this section. '
         || 'Replace this placeholder text with the real lesson notes from the admin panel.',
       600,
       (g.n = 1 and mo.sort_order = 1),
       g.n
from public.modules mo
cross join generate_series(1, 3) as g(n)
where not exists (select 1 from public.lessons l where l.module_id = mo.id);

-- ---------- Resources (e-books) ----------
insert into public.resources (slug, title, author, kind, description, price_bdt, pages, is_featured, is_premium) values
  ('admission-formula-book','The Admission Formula','MCA Faculty','ebook',
   'A concise handbook of strategies, formulas, and shortcuts for university admission tests.',
   250, 120, true, true),
  ('cv-that-gets-interviews','The CV That Gets Interviews','MCA Faculty','cv_template',
   'Ready-to-use CV templates plus a guide to writing bullet points that recruiters notice.',
   0, 24, true, false),
  ('developer-roadmap-2026','Developer Roadmap 2026','MCA Faculty','roadmap',
   'A step-by-step roadmap from beginner to job-ready developer, with resources at every stage.',
   150, 40, false, true)
on conflict (slug) do nothing;

-- ---------- Mock tests + questions ----------
insert into public.mock_tests (slug, title, category_id, test_type, duration_minutes, total_marks, is_free)
values
  ('basic-programming-quiz','Basic Programming Quiz',
   (select id from public.categories where slug='programming'), 'topic', 10, 3, true),
  ('english-grammar-check','English Grammar Check',
   (select id from public.categories where slug='english'), 'topic', 10, 3, true)
on conflict (slug) do nothing;

insert into public.mock_questions (mock_test_id, question, options, correct_key, marks, explanation, sort_order)
select t.id, q.question, q.options::jsonb, q.correct_key, 1, q.explanation, q.sort_order
from public.mock_tests t
join (values
  ('basic-programming-quiz', 'Which keyword declares a constant in JavaScript?',
     '[{"key":"a","label":"var"},{"key":"b","label":"let"},{"key":"c","label":"const"},{"key":"d","label":"static"}]',
     'c', 'const declares a block-scoped constant.', 1),
  ('basic-programming-quiz', 'What does HTML stand for?',
     '[{"key":"a","label":"Hyper Trainer Marking Language"},{"key":"b","label":"HyperText Markup Language"},{"key":"c","label":"HighText Markup Language"},{"key":"d","label":"Hyperlinks Text Mark Language"}]',
     'b', 'HTML = HyperText Markup Language.', 2),
  ('basic-programming-quiz', 'Which symbol starts a single-line comment in JavaScript?',
     '[{"key":"a","label":"#"},{"key":"b","label":"//"},{"key":"c","label":"<!--"},{"key":"d","label":"**"}]',
     'b', '// starts a single-line comment in JavaScript.', 3),
  ('english-grammar-check', 'Choose the correct sentence.',
     '[{"key":"a","label":"He don''t like tea."},{"key":"b","label":"He doesn''t likes tea."},{"key":"c","label":"He doesn''t like tea."},{"key":"d","label":"He not like tea."}]',
     'c', 'Third-person singular uses does + base verb.', 1),
  ('english-grammar-check', 'Pick the correct article: ___ university is nearby.',
     '[{"key":"a","label":"a"},{"key":"b","label":"an"},{"key":"c","label":"the"},{"key":"d","label":"no article"}]',
     'a', '"University" begins with a /juː/ sound, so it takes "a".', 2),
  ('english-grammar-check', 'What is the past tense of "go"?',
     '[{"key":"a","label":"goed"},{"key":"b","label":"gone"},{"key":"c","label":"went"},{"key":"d","label":"going"}]',
     'c', 'The simple past of "go" is "went".', 3)
) as q(test_slug, question, options, correct_key, explanation, sort_order)
  on q.test_slug = t.slug
where not exists (
  select 1 from public.mock_questions mq
  where mq.mock_test_id = t.id and mq.sort_order = q.sort_order
);

-- ---------- Blog posts (4, published) ----------
insert into public.blog_posts (slug, title, excerpt, content_md, status, published_at, tags) values
  ('how-to-choose-a-mentor','How to Choose the Right Mentor',
   'A mentor can change the trajectory of your career. Here is how to pick one.',
   E'# How to Choose the Right Mentor\n\nA good mentor gives you guidance, accountability, and direction.\n\n## 1. Look for relevant experience\n\nChoose someone who has walked the path you want to walk.\n\n## 2. Value communication\n\nThe best mentor is one who explains clearly and listens well.\n\n## 3. Commit to the process\n\nMentorship works when you show up consistently.',
   'published', now() - interval '5 days', array['career','mentorship']),
  ('study-plan-that-works','Building a Study Plan That Actually Works',
   'Stop cramming. Build a realistic weekly plan you can stick to.',
   E'# Building a Study Plan That Works\n\nConsistency beats intensity.\n\n## Start small\n\nBegin with 25-minute focused sessions.\n\n## Review weekly\n\nEvery Sunday, review what worked and adjust.',
   'published', now() - interval '3 days', array['productivity','study']),
  ('breaking-into-tech','Breaking Into Tech Without a CS Degree',
   'You do not need a CS degree to become a developer. Here is a practical path.',
   E'# Breaking Into Tech\n\nMany successful developers are self-taught.\n\n## Build projects\n\nEmployers care about what you can build.\n\n## Get feedback\n\nA mentor shortens the learning curve dramatically.',
   'published', now() - interval '1 day', array['programming','career']),
  ('welcome-to-mca','Welcome to Meaningful Career Academy',
   'What MCA is, why we built it, and how it helps you build a meaningful career.',
   E'# Welcome to MCA\n\nMCA is a mentorship-first platform.\n\nWe believe students deserve guidance, not just content.\n\nExplore our programs, meet mentors, and start your journey.',
   'published', now(), array['announcement'])
on conflict (slug) do nothing;

-- ---------- Live classes (3 upcoming) ----------
insert into public.live_classes (title, description, starts_at, meeting_url, is_public)
select v.title, v.description, v.starts_at, v.meeting_url, true
from (values
  ('Admission Q&A Live Session', 'Bring your questions about university admission.',
     now() + interval '2 days', 'https://meet.google.com/placeholder-1'),
  ('Intro to Web Development', 'A live walkthrough of your first web page.',
     now() + interval '5 days', 'https://meet.google.com/placeholder-2'),
  ('English Speaking Practice', 'Live conversation practice with guidance.',
     now() + interval '8 days', 'https://meet.google.com/placeholder-3')
) as v(title, description, starts_at, meeting_url)
where not exists (select 1 from public.live_classes lc where lc.title = v.title);
