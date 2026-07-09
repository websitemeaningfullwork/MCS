import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteLiveClass } from "@/features/admin/live-class-actions";

export const metadata: Metadata = { title: "Live classes admin" };

export default async function AdminLiveClassesPage() {
  const { supabase } = await requireAdmin();
  const { data: classes } = await supabase
    .from("live_classes")
    .select("id, title, starts_at, is_public")
    .order("starts_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Live Classes
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/admin/live-classes/new">
            <Plus className="size-4" />
            New class
          </Link>
        </Button>
      </div>

      {!classes || classes.length === 0 ? (
        <EmptyState title="No live classes" description="Schedule your first class." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {classes.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.starts_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/live-classes/${c.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteButton id={c.id} onDelete={deleteLiveClass} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
