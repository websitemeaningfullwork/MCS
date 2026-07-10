"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  id,
  onDelete,
  size = "sm",
  label,
}: {
  id: string;
  onDelete: (id: string) => Promise<{ error?: string }>;
  size?: "sm" | "default";
  /** Optional item name, e.g. the title — makes the icon button's accessible name specific. */
  label?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await onDelete(id);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      setConfirming(false);
      return;
    }
    toast.success("Deleted.");
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <Button
          size={size}
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirm
        </Button>
        <Button
          size={size}
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </span>
    );
  }

  return (
    <Button
      size={size}
      variant="ghost"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => setConfirming(true)}
      aria-label={label ? `Delete ${label}` : "Delete"}
      title={label ? `Delete ${label}` : "Delete"}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
