"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/shared/language-provider";
import { localize } from "@/lib/i18n";

/**
 * Real search entry point. Opens a dialog and routes to the programs catalog
 * with a `?q=` query (the list page already filters on it). Replaces the old
 * decorative link that just navigated to /programs.
 */
export function NavSearch({ label = "Search" }: { label?: string }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    setOpen(false);
    router.push(q ? `/programs?q=${encodeURIComponent(q)}` : "/programs");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          className="hidden sm:inline-flex"
        >
          <Search className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {localize(lang, { en: "Search programs", bn: "প্রোগ্রাম খুঁজুন" })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={localize(lang, {
              en: "Search programs by title…",
              bn: "প্রোগ্রামের নাম লিখে খুঁজুন…",
            })}
            aria-label={localize(lang, { en: "Search programs", bn: "প্রোগ্রাম খুঁজুন" })}
            className="pl-9"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
