import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { requireMentor } from "@/lib/mentor-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/marketing/empty-state";

export const metadata: Metadata = { title: "My Programs" };

export default async function MentorProgramsPage() {
  const { user, supabase } = await requireMentor();

  const { data: programs } = await supabase
    .from("programs")
    .select("id, title, slug, status, enrolled_count")
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        My Programs
      </h1>

      {!programs || programs.length === 0 ? (
        <EmptyState
          title="No programs assigned"
          description="An admin assigns programs to you. They'll show up here."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {programs.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.enrolled_count ?? 0} enrolled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "published" ? "default" : "secondary"}>
                  {p.status}
                </Badge>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/programs/${p.slug}`}>
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
