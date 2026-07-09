"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markLessonComplete } from "@/features/learning/actions";

export function MarkCompleteButton({
  lessonId,
  programId,
  completed,
}: {
  lessonId: string;
  programId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await markLessonComplete(lessonId, programId);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    toast.success("Lesson marked complete.");
    router.refresh();
    setLoading(false);
  }

  if (completed) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="size-4 text-success" />
        Completed
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      Mark complete
    </Button>
  );
}
