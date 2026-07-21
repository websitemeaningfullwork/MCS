"use client";

import { PlayCircle } from "lucide-react";

/** Normalise any YouTube URL to a privacy-friendly embed URL. */
function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const id =
    url.match(/[?&]v=([\w-]{11})/)?.[1] ??
    url.match(/youtu\.be\/([\w-]{11})/)?.[1] ??
    url.match(/\/embed\/([\w-]{11})/)?.[1] ??
    null;
  if (!id) return url.includes("/embed/") ? url : null;
  // rel=0 keeps related videos from other channels out; modestbranding + nocookie
  // keep the student on MCA and minimise YouTube chrome.
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

export function YouTubeEmbed({
  url,
  title,
}: {
  url: string | null;
  title: string;
}) {
  const embed = toEmbedUrl(url);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-card">
      {embed ? (
        <iframe
          key={embed}
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <PlayCircle className="size-10" />
          <p className="text-sm">No video for this lesson yet.</p>
        </div>
      )}
    </div>
  );
}
