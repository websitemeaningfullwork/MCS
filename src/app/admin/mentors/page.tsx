import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteMentor } from "@/features/admin/mentor-actions";

export const metadata: Metadata = { title: "Mentors admin" };

/**
 * Why a mentor row is invisible on the public site, or null when it is visible.
 *
 * This list reads the base `mentors` table, but every public surface reads the
 * `public_mentors` view (migration 012), which additionally requires
 * `profiles.role = 'mentor'`. A mentor row attached to an admin's or a student's
 * profile therefore shows up here and *nowhere else* — which reads as "mentors
 * exist but the site is broken". Mirror the view's WHERE clause so the gap is
 * stated instead of silent.
 */
function hiddenReason(role: string | undefined, m: { is_active: boolean | null; status: string | null }) {
  if (role !== "mentor") {
    return role
      ? `Their account role is "${role}", not Mentor — set it in Admin → Users.`
      : "This mentor has no profile account behind it.";
  }
  if (m.is_active === false) return "Marked inactive — turn Active back on to publish.";
  if ((m.status ?? "active") !== "active") {
    return `Status is "${m.status}" — only "active" mentors are published.`;
  }
  return null;
}

export default async function AdminMentorsPage() {
  const { supabase } = await requireAdmin();

  const { data: mentors } = await supabase
    .from("mentors")
    .select("id, headline, is_verified, is_featured, is_active, status, sort_order")
    .order("sort_order", { ascending: true });
  const ids = (mentors ?? []).map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email, role").in("id", ids)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows = (mentors ?? []).map((m) => ({
    ...m,
    profile: profileById.get(m.id),
    hidden: hiddenReason(profileById.get(m.id)?.role, m),
  }));
  const publicCount = rows.filter((r) => !r.hidden).length;

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

      {rows.length > 0 && publicCount === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <EyeOff className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              No mentor is visible on the public site right now.
            </p>
            <p className="mt-1 text-muted-foreground">
              Every mentor below fails the publish check, so <code>/mentors</code>, the
              homepage mentor section and program pages all show none. See the reason on
              each row.
            </p>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="No mentors" description="Create your first mentor." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {rows.map((m) => {
            const p = m.profile;
            return (
              <li key={m.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {p?.full_name ?? "Mentor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.headline ?? p?.email ?? ""}
                  </p>
                  {m.hidden ? (
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                      <EyeOff className="mt-0.5 size-3.5 shrink-0" />
                      <span>Not shown publicly. {m.hidden}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {m.is_featured ? <Badge variant="secondary">Featured</Badge> : null}
                  {m.is_verified ? <Badge>Verified</Badge> : null}
                  {m.hidden ? <Badge variant="destructive">Not public</Badge> : null}
                  {m.status && m.status !== "active" ? (
                    <Badge variant="outline" className="capitalize text-muted-foreground">
                      {m.status}
                    </Badge>
                  ) : m.is_active === false ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  ) : null}
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
