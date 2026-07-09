import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteProgram } from "@/features/admin/program-actions";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Programs admin" };

export default async function AdminProgramsPage() {
  const { supabase } = await requireAdmin();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, title, slug, price_bdt, status")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Programs
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/admin/programs/new">
            <Plus className="size-4" />
            New program
          </Link>
        </Button>
      </div>

      {!programs || programs.length === 0 ? (
        <EmptyState title="No programs" description="Create your first program." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {programs.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBDT(p.price_bdt)} · /{p.slug}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "published" ? "default" : "secondary"}>
                  {p.status}
                </Badge>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/programs/${p.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteButton id={p.id} onDelete={deleteProgram} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
