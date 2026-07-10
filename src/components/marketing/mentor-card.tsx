import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MentorCardData = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  expertise: string[] | null;
  rating: number | null;
  reviews_count: number | null;
  is_verified: boolean | null;
};

function initials(name: string | null): string {
  if (!name) return "M";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();
}

export function MentorCard({
  mentor,
  className,
}: {
  mentor: MentorCardData;
  className?: string;
}) {
  const rating = mentor.rating ?? 0;

  return (
    <Link
      href={`/mentors/${mentor.id}`}
      className={cn(
        "group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30",
        className,
      )}
    >
      <Avatar className="size-20 border border-border">
        {mentor.avatar_url ? (
          <AvatarImage src={mentor.avatar_url} alt={mentor.full_name ?? "Mentor"} />
        ) : null}
        <AvatarFallback className="bg-secondary text-lg font-semibold text-foreground">
          {initials(mentor.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="mt-4 flex items-center gap-1.5">
        <h3 className="font-semibold text-foreground">
          {mentor.full_name ?? "MCA Mentor"}
        </h3>
        {mentor.is_verified ? (
          <BadgeCheck className="size-4 text-primary" role="img" aria-label="Verified mentor" />
        ) : null}
      </div>

      {mentor.headline ? (
        <p className="mt-1 text-sm text-muted-foreground">{mentor.headline}</p>
      ) : null}

      {mentor.expertise && mentor.expertise.length > 0 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {mentor.expertise.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {rating > 0 ? (
        <div className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-4 fill-warning text-warning" />
          <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
          {mentor.reviews_count ? <span>({mentor.reviews_count})</span> : null}
        </div>
      ) : null}
    </Link>
  );
}
