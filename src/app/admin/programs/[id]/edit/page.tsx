import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { ProgramForm } from "@/components/admin/program-form";
import { ModuleManager } from "@/components/admin/module-manager";

export const metadata: Metadata = { title: "Edit program" };

type Level = "beginner" | "intermediate" | "advanced" | "all_levels";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!program) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  const { data: mentorRows } = await supabase.from("mentors").select("id");
  const mentorIds = (mentorRows ?? []).map((m) => m.id);
  const { data: profiles } = mentorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", mentorIds)
    : { data: [] };
  const mentors = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? "Mentor",
  }));

  // Curriculum
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort_order")
    .eq("program_id", id)
    .order("sort_order", { ascending: true });
  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id, module_id, title, is_preview, sort_order")
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const moduleTree = (modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    lessons: (lessons ?? [])
      .filter((l) => l.module_id === m.id)
      .map((l) => ({ id: l.id, title: l.title, is_preview: l.is_preview })),
  }));

  return (
    <div className="space-y-8">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to programs
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Edit program
      </h1>

      <ProgramForm
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        mentors={mentors}
        initial={{
          id: program.id,
          title: program.title,
          slug: program.slug,
          subtitle: program.subtitle ?? "",
          description: program.description ?? "",
          category_id: program.category_id,
          mentor_id: program.mentor_id,
          price_bdt: Number(program.price_bdt ?? 0),
          discount_bdt: Number(program.discount_bdt ?? 0),
          level: (program.level ?? "all_levels") as Level,
          learning_outcomes: program.learning_outcomes ?? [],
          requirements: program.requirements ?? [],
          is_featured: program.is_featured ?? false,
          status: (program.status ?? "draft") as "draft" | "published",
        }}
      />

      <div>
        <h2 className="text-lg font-semibold text-foreground">Curriculum</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Add modules and lessons (YouTube embeds).
        </p>
        <ModuleManager programId={program.id} modules={moduleTree} />
      </div>
    </div>
  );
}
