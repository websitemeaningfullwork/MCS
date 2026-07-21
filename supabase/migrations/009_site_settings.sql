-- ============================================================
-- Migration 009 — site_settings (global, admin-controlled config)
--
-- Introduces a single-row settings table that the admin edits from
-- Admin → Settings. First use: the floating WhatsApp support button
-- (Homepage Update 01 / "fully redesign the website"). Designed as a
-- singleton (id = 'global') so future website settings just add columns.
--
-- RLS mirrors payment_settings: everything here is public-by-design
-- (the WhatsApp number/link is meant to be shown to visitors), so the
-- read policy is `using (true)` and only admins may write.
--
-- Safe to re-run (idempotent).
-- ============================================================

create table if not exists public.site_settings (
  id                     text primary key default 'global',
  -- WhatsApp floating button ---------------------------------------------
  whatsapp_enabled       boolean not null default false,
  whatsapp_connection    text    not null default 'number',   -- 'number' | 'link'
  whatsapp_number        text,
  whatsapp_link          text,
  whatsapp_message       text    default 'Hello! I want to know more about MCA.',
  whatsapp_position      text    not null default 'bottom-right', -- 'bottom-right' | 'bottom-left'
  whatsapp_size          text    not null default 'md',         -- 'sm' | 'md' | 'lg'
  whatsapp_animation     boolean not null default true,
  updated_at             timestamptz default now(),
  updated_by             uuid references public.profiles(id) on delete set null,
  constraint site_settings_singleton check (id = 'global'),
  constraint site_settings_connection_chk check (whatsapp_connection in ('number','link')),
  constraint site_settings_position_chk   check (whatsapp_position in ('bottom-right','bottom-left')),
  constraint site_settings_size_chk       check (whatsapp_size in ('sm','md','lg'))
);

-- Seed the singleton row (disabled by default until the admin configures it).
insert into public.site_settings (id) values ('global')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.site_settings enable row level security;

drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings: admin write" on public.site_settings;
create policy "site_settings: admin write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());
