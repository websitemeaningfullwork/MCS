"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCheck,
  CreditCard,
  MessageCircle,
  Star,
} from "lucide-react";

import { useDict } from "@/components/shared/language-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/browser";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database.types";

type Notif = {
  id: string;
  role: string;
  type: string;
  title: string;
  body: string | null;
  payload: Json;
  read: boolean;
  created_at: string | null;
};

/**
 * Where a notification should take the user. New fan-out rows embed an explicit
 * `href` in their payload; older rows (Chunk 7 appointments) fall back to a
 * role-appropriate page derived from the payload keys.
 */
function hrefFor(n: Notif): string {
  const p = (n.payload ?? {}) as Record<string, unknown>;
  if (typeof p.href === "string" && p.href.startsWith("/")) return p.href;
  if (p.appointment_id) {
    return n.role === "admin" ? "/admin/appointments" : "/dashboard/appointments";
  }
  return n.role === "admin" ? "/admin" : "/dashboard";
}

/** String-key icon + accent per event family (green stays status-only). */
function iconFor(type: string): { Icon: typeof Bell; chip: string } {
  if (type.startsWith("appointment")) {
    return { Icon: Calendar, chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
  }
  if (type.startsWith("payment")) {
    return { Icon: CreditCard, chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400" };
  }
  if (type.startsWith("question")) {
    return { Icon: MessageCircle, chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
  }
  if (type.startsWith("review")) {
    return { Icon: Star, chip: "bg-amber-500/10 text-amber-600 dark:text-amber-500" };
  }
  return { Icon: Bell, chip: "bg-primary/10 text-primary" };
}

/** Fetch the RLS-scoped feed: latest rows + unread count. */
async function fetchFeed(): Promise<{ items: Notif[]; unread: number }> {
  const supabase = createClient();
  const [listRes, countRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, role, type, title, body, payload, read, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false),
  ]);
  // Degrade gracefully (e.g. migration 013 not applied yet): show an empty feed.
  return { items: listRes.data ?? [], unread: countRes.count ?? 0 };
}

/**
 * Navbar notification bell (Chunk 9). Client-side island: reads the caller's
 * personal feed — plus the admin broadcast feed for admins — straight through
 * RLS with the browser client, so the (static) root layout stays static.
 * Mounted only when the user is authenticated.
 */
export function NotificationBell() {
  const dict = useDict();
  const router = useRouter();
  const [items, setItems] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const feed = await fetchFeed();
    setItems(feed.items);
    setUnread(feed.unread);
  }, []);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const feed = await fetchFeed();
      if (!active) return;
      setItems(feed.items);
      setUnread(feed.unread);
    }
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  function onOpenChange(open: boolean) {
    if (open) load();
  }

  function markOneRead(n: Notif) {
    if (n.read) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev);
    setUnread((u) => Math.max(0, u - 1));
    const supabase = createClient();
    void supabase.from("notifications").update({ read: true }).eq("id", n.id);
  }

  async function markAllRead() {
    setItems((prev) => prev?.map((x) => ({ ...x, read: true })) ?? prev);
    setUnread(0);
    const supabase = createClient();
    // Unfiltered on purpose: RLS scopes the update to rows the caller may touch
    // (their personal feed + the admin broadcast feed for admins).
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    router.refresh();
  }

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unread > 0
              ? `${dict.notifications.title} (${unread} ${dict.notifications.unread})`
              : dict.notifications.title
          }
          className="relative rounded-full"
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white"
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {dict.notifications.title}
            {unread > 0 ? (
              <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {badge}
              </span>
            ) : null}
          </p>
          {unread > 0 ? (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              {dict.notifications.markAllRead}
            </button>
          ) : null}
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
          {items === null ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {dict.common.loading}
            </p>
          ) : items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">{dict.notifications.empty}</p>
            </div>
          ) : (
            items.map((n) => {
              const { Icon, chip } = iconFor(n.type);
              return (
                <DropdownMenuItem key={n.id} asChild>
                  <Link
                    href={hrefFor(n)}
                    onClick={() => markOneRead(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        chip,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm text-foreground",
                            !n.read && "font-semibold",
                          )}
                        >
                          {n.title}
                        </span>
                        {!n.read ? (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      {n.body ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      ) : null}
                      <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
