import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/marketing/program-card";
import { ResourceCard } from "@/components/marketing/resource-card";

export const metadata: Metadata = { title: "Saved" };

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("item_type, item_id, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const rows = bookmarks ?? [];
  const programIds = rows
    .filter((b) => b.item_type === "program")
    .map((b) => b.item_id)
    .filter((id): id is string => Boolean(id));
  const resourceIds = rows
    .filter((b) => b.item_type === "resource")
    .map((b) => b.item_id)
    .filter((id): id is string => Boolean(id));

  const [{ data: programs }, { data: resources }] = await Promise.all([
    programIds.length
      ? supabase.from("programs").select("*").eq("status", "published").in("id", programIds)
      : Promise.resolve({ data: [] as never[] }),
    resourceIds.length
      ? supabase.from("public_resources").select("*").in("id", resourceIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const programList = programs ?? [];
  const resourceList = resources ?? [];
  const empty = programList.length === 0 && resourceList.length === 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Saved</h1>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold text-foreground">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap “Save” on any program or resource to keep it here.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/programs">Browse programs</Link>
          </Button>
        </div>
      ) : (
        <>
          {programList.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Programs</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {programList.map((program) => (
                  <ProgramCard key={program.id} program={program} mentorName={null} />
                ))}
              </div>
            </section>
          ) : null}

          {resourceList.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Resources</h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {resourceList.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
