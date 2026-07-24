"use client";

import { PlayCircle } from "lucide-react";

import { youtubeEmbedUrl } from "@/lib/youtube";

/**
 * Reusable, privacy-friendly YouTube player. Used by the course player for
 * lesson videos and by the public program page for the trailer, so it lives in
 * shared/ rather than inside a single feature.
 */
export function YouTubeEmbed({
  url,
  title,
  emptyLabel = "No video available yet.",
}: {
  url: string | null;
  title: string;
  emptyLabel?: string;
}) {
  const embed = youtubeEmbedUrl(url);
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
          <p className="text-sm">{emptyLabel}</p>
        </div>
      )}
    </div>
  );
}
