"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";

import { markAllNotificationsRead } from "@/features/notifications/actions";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string | null;
};

export function AdminNotifications({ notifications }: { notifications: Notif[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  function markAll() {
    start(async () => {
      const res = await markAllNotificationsRead("admin");
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <h2 className="font-semibold text-foreground">Notifications</h2>
          {unread > 0 ? (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-xs font-semibold text-white">
              {unread}
            </span>
          ) : null}
        </div>
        {unread > 0 ? (
          <button
            onClick={markAll}
            disabled={busy}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Mark all as read
          </button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-xl border p-3",
                n.read ? "border-border" : "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {!n.read ? <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" /> : null}
              </div>
              {n.body ? <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
