import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteMentor } from "@/features/admin/mentor-actions";

export const metadata: Metadata = { title: "Mentors admin" };

export default async function AdminMentorsPage() {
  const { supabase } = await requireAdmin();

  const { data: mentors } = await supabase
    .from("mentors")
    .select("id, headline, is_verified, is_featured");
  const ids = (mentors ?? []).map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Mentors
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/admin/mentors/new">
            <Plus className="size-4" />
            New mentor
          </Link>
        </Button>
      </div>

      {!mentors || mentors.length === 0 ? (
        <EmptyState title="No mentors" description="Create your first mentor." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {mentors.map((m) => {
            const p = profileById.get(m.id);
            return (
              <li key={m.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {p?.full_name ?? "Mentor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.headline ?? p?.email ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.is_featured ? <Badge variant="secondary">Featured</Badge> : null}
                  {m.is_verified ? <Badge>Verified</Badge> : null}
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/mentors/${m.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <DeleteButton id={m.id} onDelete={deleteMentor} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
