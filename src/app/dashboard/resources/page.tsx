import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Download } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { RESOURCE_KIND_LABELS } from "@/components/marketing/resource-card";

export const metadata: Metadata = { title: "My Resources" };

export default async function MyResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: access } = await supabase
    .from("resource_access")
    .select("resource_id")
    .eq("user_id", user!.id);

  const resourceIds = (access ?? [])
    .map((a) => a.resource_id)
    .filter((id): id is string => Boolean(id));

  // Ownership is already established via resource_access above; read the (now
  // admin-only) resources table with the service role to show titles + files.
  const admin = createAdminClient();
  const { data: resources } = resourceIds.length
    ? await admin
        .from("resources")
        .select("id, title, kind, author, file_storage_path")
        .in("id", resourceIds)
    : { data: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        My Resources
      </h1>

      {!resources || resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold text-foreground">No resources yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your purchased e-books and resources will appear here.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/resources">Browse resources</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <p className="font-medium text-foreground">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {RESOURCE_KIND_LABELS[resource.kind] ?? "Resource"}
                    {resource.author ? ` · ${resource.author}` : ""}
                  </p>
                </div>
              </div>
              {resource.file_storage_path ? (
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href={`/dashboard/resources/${resource.id}/download`}>
                    <Download className="size-4" />
                    Download
                  </Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  File coming soon
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
