-- ============================================================
-- Migration 013 — Appointment Booking System
--
-- Chunk 7 of the "fully redesign the website" effort. Adds the end-to-end
-- one-on-one mentoring booking module: admin-managed appointment *types*, the
-- student *appointments* themselves (5-step wizard → manual bKash payment →
-- admin verification → confirmation), and an in-app *notifications* feed that
-- powers the admin dashboard's "Real-time Notifications" panel and (Chunk 9)
-- the navbar bell.
--
-- Slots are derived at request time from each mentor's `availability` jsonb +
-- `session_duration` (Chunk 6, migration 012) minus already-booked slots — no
-- separate slot table. Pricing comes from `mentors.session_price_bdt`.
--
-- Payment reuses the manual-bKash pattern (owner-folder `payment-screenshots`
-- bucket, migration 003) but is kept self-contained on the appointment row so
-- it does not entangle the program/resource `orders` pipeline. An appointment
-- is `pending` + `unpaid` on creation, `submitted` once the student sends the
-- TrxID, and an admin flips it to `paid` → `confirmed`.
--
-- All statements idempotent. RLS ON with explicit policies.
-- ============================================================

-- ------------------------------------------------------------
-- 1. appointment_types — admin-managed booking categories.
-- ------------------------------------------------------------
create table if not exists public.appointment_types (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  description      text,
  icon             text not null default 'compass',   -- string key resolved client-side
  default_price_bdt numeric(10,2) not null default 0,
  default_duration int not null default 120,          -- minutes
  status           text not null default 'active',    -- active | inactive
  sort_order       int not null default 0,
  created_at       timestamptz default now()
);

do $$ begin
  alter table public.appointment_types
    add constraint appointment_types_status_chk check (status in ('active','inactive'));
exception when duplicate_object then null; end $$;

create index if not exists appointment_types_status_idx
  on public.appointment_types(status, sort_order);

-- ------------------------------------------------------------
-- 2. appointments — one booking per student/mentor/slot.
-- ------------------------------------------------------------
create table if not exists public.appointments (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  mentor_id        uuid not null references public.mentors(id) on delete restrict,
  type_id          uuid references public.appointment_types(id) on delete set null,
  appointment_date date not null,
  start_time       text not null,                    -- 'HH:MM' (24h)
  end_time         text,                             -- 'HH:MM' (24h)
  duration         int  not null default 120,        -- minutes
  platform         text not null default 'Google Meet',
  meeting_link     text,
  amount_bdt       numeric(10,2) not null default 0,
  -- payment (manual bKash, self-contained)
  payment_method   text not null default 'bkash',
  sender_number    text,
  transaction_id   text,
  paid_amount_bdt  numeric(10,2),
  screenshot_path  text,
  payment_status   text not null default 'unpaid',   -- unpaid | submitted | paid | refunded
  status           text not null default 'pending',  -- pending|confirmed|completed|cancelled|rescheduled|no_show
  details          jsonb not null default '{}'::jsonb, -- name/phone/whatsapp/gender/age/occupation/note/topic/type_name
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

do $$ begin
  alter table public.appointments
    add constraint appointments_status_chk
    check (status in ('pending','confirmed','completed','cancelled','rescheduled','no_show'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.appointments
    add constraint appointments_payment_status_chk
    check (payment_status in ('unpaid','submitted','paid','refunded'));
exception when duplicate_object then null; end $$;

create index if not exists appointments_user_idx    on public.appointments(user_id, created_at desc);
create index if not exists appointments_mentor_idx  on public.appointments(mentor_id, appointment_date);
create index if not exists appointments_date_idx    on public.appointments(appointment_date, start_time);
create index if not exists appointments_status_idx  on public.appointments(status);

-- No two live bookings may take the same mentor slot (cancelled frees it).
create unique index if not exists appointments_slot_uniq
  on public.appointments(mentor_id, appointment_date, start_time)
  where status <> 'cancelled';

-- ------------------------------------------------------------
-- 3. notifications — in-app feed for student / mentor / admin.
--    Personal rows carry user_id; admin-broadcast rows have user_id NULL + role='admin'.
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text not null default 'student',        -- student | mentor | admin
  type       text not null,                          -- e.g. appointment_booked, payment_received
  title      text not null,
  body       text,
  payload    jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx  on public.notifications(user_id, read, created_at desc);
create index if not exists notifications_admin_idx on public.notifications(role, read, created_at desc)
  where user_id is null;

-- ------------------------------------------------------------
-- 4. updated_at trigger for appointments.
-- ------------------------------------------------------------
create or replace function public.touch_appointments_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;$$;
drop trigger if exists trg_touch_appointments_updated_at on public.appointments;
create trigger trg_touch_appointments_updated_at
  before update on public.appointments
  for each row execute function public.touch_appointments_updated_at();

-- ------------------------------------------------------------
-- 5. Column guard — a student may create/cancel/reschedule their own booking and
--    submit a payment TrxID, but may NEVER self-confirm, self-complete, mark a
--    no-show, or self-mark a payment paid/refunded. Admin + service role bypass.
-- ------------------------------------------------------------
create or replace function public.protect_appointments()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- New student bookings are always pending + owe payment.
    new.status := 'pending';
    if new.payment_status not in ('unpaid','submitted') then
      new.payment_status := 'unpaid';
    end if;
    return new;
  end if;

  -- UPDATE by the owner: block privileged transitions.
  if new.status is distinct from old.status
     and new.status in ('confirmed','completed','no_show') then
    raise exception 'Not allowed to set this appointment status';
  end if;
  if new.payment_status is distinct from old.payment_status
     and new.payment_status in ('paid','refunded') then
    raise exception 'Not allowed to set this payment status';
  end if;
  -- The verified amount is admin-controlled.
  if new.amount_bdt is distinct from old.amount_bdt then
    raise exception 'Not allowed to modify the appointment amount';
  end if;
  return new;
end;$$;

drop trigger if exists trg_protect_appointments on public.appointments;
create trigger trg_protect_appointments
  before insert or update on public.appointments
  for each row execute function public.protect_appointments();

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------
alter table public.appointment_types enable row level security;
alter table public.appointments      enable row level security;
alter table public.notifications     enable row level security;

-- appointment_types: everyone reads active; admins read/write all.
drop policy if exists "appt_types: read active" on public.appointment_types;
create policy "appt_types: read active" on public.appointment_types
  for select using (status = 'active' or public.is_admin());

drop policy if exists "appt_types: admin write" on public.appointment_types;
create policy "appt_types: admin write" on public.appointment_types
  for all using (public.is_admin()) with check (public.is_admin());

-- appointments: student reads own, mentor reads theirs, admin reads all.
drop policy if exists "appointments: read own" on public.appointments;
create policy "appointments: read own" on public.appointments
  for select using (
    user_id = auth.uid() or mentor_id = auth.uid() or public.is_admin()
  );

-- Student inserts own (guard trigger forces pending/unpaid). Slot must be free is
-- enforced by the unique index; overlaps surface as a friendly error server-side.
drop policy if exists "appointments: student insert own" on public.appointments;
create policy "appointments: student insert own" on public.appointments
  for insert with check (user_id = auth.uid());

-- Student updates own (guard trigger blocks privileged transitions).
drop policy if exists "appointments: student update own" on public.appointments;
create policy "appointments: student update own" on public.appointments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin full write.
drop policy if exists "appointments: admin write" on public.appointments;
create policy "appointments: admin write" on public.appointments
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications: read own personal + admin broadcast; mark-read own; admin writes.
drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications
  for select using (
    user_id = auth.uid()
    or (user_id is null and role = 'admin' and public.is_admin())
  );

drop policy if exists "notifications: update own" on public.notifications;
create policy "notifications: update own" on public.notifications
  for update using (
    user_id = auth.uid()
    or (user_id is null and role = 'admin' and public.is_admin())
  ) with check (
    user_id = auth.uid()
    or (user_id is null and role = 'admin' and public.is_admin())
  );

-- Only admins (and the service role, which bypasses RLS) create notifications.
drop policy if exists "notifications: admin insert" on public.notifications;
create policy "notifications: admin insert" on public.notifications
  for insert with check (public.is_admin());

-- ------------------------------------------------------------
-- 7. Seed the default appointment types (idempotent by name).
-- ------------------------------------------------------------
insert into public.appointment_types (name, description, icon, default_price_bdt, default_duration, status, sort_order)
select v.name, v.description, v.icon, 700, 120, 'active', v.sort_order
from (values
  ('Career Guidance',          'Career path, future planning, job direction',       'compass',       1),
  ('Study Planning',           'Study plan, exam preparation, productivity',         'book-open',     2),
  ('University Admission',     'Admission guidance, university selection',           'graduation-cap',3),
  ('Job & Career Life',        'Job search, career growth, workplace issues',        'briefcase',     4),
  ('Depression & Life Support','Mental health, stress, anxiety, life problems',      'heart-pulse',   5),
  ('Interview Preparation',    'Interview guidance, confidence building',            'messages-square',6),
  ('Own Topic',                'I want to discuss something else',                   'sparkles',      7)
) as v(name, description, icon, sort_order)
where not exists (
  select 1 from public.appointment_types t where t.name = v.name
);
