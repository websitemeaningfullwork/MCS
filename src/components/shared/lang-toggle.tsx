"use client";

import { useLanguage } from "@/components/shared/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
        className={cn(
          "h-7 rounded-full px-2.5",
          lang === "en"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground",
        )}
      >
        EN
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={lang === "bn"}
        onClick={() => setLang("bn")}
        className={cn(
          "font-bengali h-7 rounded-full px-2.5",
          lang === "bn"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground",
        )}
      >
        বাংলা
      </Button>
    </div>
  );
}
