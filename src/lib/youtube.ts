/**
 * Single source of truth for turning any user- or admin-supplied YouTube link
 * into something we can embed or thumbnail.
 *
 * Admins paste links in many shapes — watch?v=, youtu.be short links, /embed/,
 * /shorts/, /live/, the legacy /v/ path, or occasionally just the bare 11-char
 * id — so every one of those must resolve to a playable embed. The id-matching
 * logic used to be copied across the course player and the admin editors and
 * had drifted (some copies rejected shorts/live links, which showed up as
 * "no video"), so it now lives here.
 */

// A YouTube video id is always 11 characters of [A-Za-z0-9_-].
const ID = "[\\w-]{11}";

const ID_PATTERNS: RegExp[] = [
  /[?&]v=([\w-]{11})/, // https://www.youtube.com/watch?v=ID
  /youtu\.be\/([\w-]{11})/, // https://youtu.be/ID
  /\/embed\/([\w-]{11})/, // https://www.youtube.com/embed/ID
  /\/shorts\/([\w-]{11})/, // https://www.youtube.com/shorts/ID
  /\/live\/([\w-]{11})/, // https://www.youtube.com/live/ID
  /\/v\/([\w-]{11})/, // https://www.youtube.com/v/ID (legacy)
];

/** Extract the 11-char video id from any common YouTube URL shape. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Some admins paste just the id.
  if (new RegExp(`^${ID}$`).test(trimmed)) return trimmed;
  for (const re of ID_PATTERNS) {
    const match = trimmed.match(re);
    // "videoseries" is YouTube's sentinel for /embed/videoseries?list=… and,
    // by coincidence, is exactly 11 chars — it isn't a real video id, so let
    // the embed helper pass the playlist URL through untouched instead.
    if (match && match[1] !== "videoseries") return match[1];
  }
  return null;
}

/** Normalise any YouTube URL to a privacy-friendly nocookie embed URL. */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = youtubeId(url);
  if (id) {
    // rel=0 keeps related videos from other channels out; modestbranding keeps
    // YouTube chrome minimal so students/visitors stay on MCA.
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  }
  // Already an embed URL whose id we can't parse (e.g. a playlist series) —
  // trust it as-is rather than dropping the video entirely.
  if (url && /\/embed\//.test(url)) return url.trim();
  return null;
}

/** hqdefault thumbnail for a video, or null when the url isn't recognised. */
export function youtubeThumbnail(url: string | null | undefined): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
