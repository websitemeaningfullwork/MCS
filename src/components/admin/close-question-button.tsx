"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closeQuestion } from "@/features/questions/actions";

export function CloseQuestionButton({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await closeQuestion(questionId);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    toast.success("Question closed.");
    router.refresh();
    setLoading(false);
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
      Mark as closed
    </Button>
  );
}
