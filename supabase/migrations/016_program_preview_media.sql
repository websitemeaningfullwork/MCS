-- ============================================================
-- Migration 016 — program preview: a video OR a photo
--
-- The sticky enrol card on the program detail page opens with a "glimpse" of
-- the course. Until now the only thing that could fill it was
-- `preview_video_url`, so every program without a filmed trailer rendered an
-- empty gradient placeholder — the most valuable slot on the page, blank, on
-- exactly the courses that were newest.
--
-- Adds a second source and an explicit choice between the two:
--   * `preview_image_url` — a still image, uploaded to the public
--     `course-assets` bucket (migration 010), same as the program cover.
--   * `preview_kind`      — which one the admin picked: 'video' | 'image'.
--
-- WHY a `preview_kind` column instead of "show whichever one is filled in":
-- both can legitimately hold a value at the same time. An admin uploads a
-- photo now and pastes the trailer link next week, or flips between the two
-- while deciding. With an implicit rule the page silently picks one, and the
-- editor's toggle can only take effect by DELETING the other value — so
-- previewing the alternative costs you the URL you had typed. Storing the
-- choice lets the admin switch back and forth without ever losing work, and
-- gives the public page one deterministic rule to follow.
--
-- Existing rows default to 'video', which is precisely what they already did,
-- so this migration is behaviour-preserving: nothing changes on the site until
-- an admin opts a program into the photo.
--
-- `programs` is admin-write / public-read-when-published (migration 000) and
-- has no column-guard trigger, so the new columns need no policy changes.
--
-- All statements idempotent / safe to re-run.
-- ============================================================

alter table public.programs
  add column if not exists preview_image_url text;

alter table public.programs
  add column if not exists preview_kind text not null default 'video';

do $$ begin
  alter table public.programs
    add constraint programs_preview_kind_chk
    check (preview_kind in ('video', 'image'));
exception when duplicate_object then null; end $$;

comment on column public.programs.preview_image_url is
  'Still image shown in the program''s enrol card when preview_kind = ''image''. Public course-assets URL.';
comment on column public.programs.preview_kind is
  'Which preview the admin chose for the enrol card: ''video'' (preview_video_url) or ''image'' (preview_image_url).';
