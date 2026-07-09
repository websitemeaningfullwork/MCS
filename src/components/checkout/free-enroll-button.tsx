"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrollFree } from "@/features/payments/actions";

export function FreeEnrollButton({
  type,
  id,
}: {
  type: "program" | "resource";
  id: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await enrollFree(type, id);
    // On success the server action redirects; only errors return here.
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full rounded-full" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      Get instant access
    </Button>
  );
}
