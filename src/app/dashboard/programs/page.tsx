import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Programs" };

export default async function MyProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("program_id, progress")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const programIds = (enrollments ?? [])
    .map((e) => e.program_id)
    .filter((id): id is string => Boolean(id));

  const { data: programs } = programIds.length
    ? await supabase.from("programs").select("id, title, slug, subtitle").in("id", programIds)
    : { data: [] };

  const progressById = new Map(
    (enrollments ?? []).map((e) => [e.program_id, Number(e.progress ?? 0)]),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        My Programs
      </h1>

      {!programs || programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold text-foreground">No programs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enrol in a program to start learning with a mentor.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/programs">Browse programs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((program) => {
            const progress = progressById.get(program.id) ?? 0;
            return (
              <div
                key={program.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <h2 className="font-semibold text-foreground">{program.title}</h2>
                {program.subtitle ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {program.subtitle}
                  </p>
                ) : null}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
                <Button asChild className="mt-4 w-fit rounded-full" size="sm">
                  <Link href={`/dashboard/learn/${program.slug}`}>
                    Open
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
