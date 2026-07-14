"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/** One-click copy for the bKash payment number, with a "Copied ✓" toast. */
export function CopyNumberButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied ✓", { description: value });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please copy the number manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy payment number ${value}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[#e2136e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#c60f5f] active:translate-y-px",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copy Number
        </>
      )}
    </button>
  );
}
