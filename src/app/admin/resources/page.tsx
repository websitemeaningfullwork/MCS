import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteResource } from "@/features/admin/resource-actions";
import { RESOURCE_KIND_LABELS } from "@/components/marketing/resource-card";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Resources admin" };

export default async function AdminResourcesPage() {
  const { supabase } = await requireAdmin();
  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, slug, kind, price_bdt")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Resources
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/admin/resources/new">
            <Plus className="size-4" />
            New resource
          </Link>
        </Button>
      </div>

      {!resources || resources.length === 0 ? (
        <EmptyState title="No resources" description="Create your first resource." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {resources.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {RESOURCE_KIND_LABELS[r.kind] ?? r.kind} · {formatBDT(r.price_bdt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/resources/${r.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteButton id={r.id} onDelete={deleteResource} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
