"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleBookmark, type BookmarkItemType } from "@/features/bookmarks/actions";
import { cn } from "@/lib/utils";

/**
 * Save/unsave toggle. Optimistic, with rollback on failure. Renders for
 * everyone; a logged-out click gets a friendly toast from the server action.
 */
export function BookmarkButton({
  itemType,
  itemId,
  initialBookmarked,
  className,
}: {
  itemType: BookmarkItemType;
  itemId: string;
  initialBookmarked: boolean;
  className?: string;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    startTransition(async () => {
      const res = await toggleBookmark(itemType, itemId);
      if ("error" in res) {
        setBookmarked(!next); // rollback
        toast.error(res.error);
      } else {
        setBookmarked(res.bookmarked);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={pending}
      aria-pressed={bookmarked}
      className={cn("gap-2 rounded-full", className)}
    >
      <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
      {bookmarked ? "Saved" : "Save"}
    </Button>
  );
}
