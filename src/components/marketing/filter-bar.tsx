"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/shared/language-provider";
import { localizeAny, type Bi } from "@/lib/i18n";

export type SelectFilter = {
  param: string;
  placeholder: string | Bi;
  /** Labels may be bilingual (static filters) or plain strings (DB content). */
  options: { value: string; label: string | Bi }[];
};

export function FilterBar({
  searchPlaceholder = { en: "Search…", bn: "খুঁজুন…" },
  filters = [],
}: {
  searchPlaceholder?: string | Bi;
  filters?: SelectFilter[];
}) {
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    // Any search/filter change returns to the first page.
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      navigate((params) => {
        if (value) params.set("q", value);
        else params.delete("q");
      });
    }, 300);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={localizeAny(lang, searchPlaceholder)}
          className="pl-9"
          aria-label={localizeAny(lang, { en: "Search", bn: "খুঁজুন" })}
        />
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.param}
          value={searchParams.get(filter.param) ?? "all"}
          onValueChange={(value) =>
            navigate((params) => {
              if (value && value !== "all") params.set(filter.param, value);
              else params.delete(filter.param);
            })
          }
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder={localizeAny(lang, filter.placeholder)} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {localizeAny(lang, opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
