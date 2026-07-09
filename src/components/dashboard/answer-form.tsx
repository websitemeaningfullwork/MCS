"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postAnswer } from "@/features/questions/actions";

export function AnswerForm({
  questionId,
  placeholder = "Write a reply…",
}: {
  questionId: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Please write a reply.");
      return;
    }
    setLoading(true);
    const res = await postAnswer(questionId, { body: body.trim() });
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder={placeholder}
      />
      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send reply
      </Button>
    </form>
  );
}
