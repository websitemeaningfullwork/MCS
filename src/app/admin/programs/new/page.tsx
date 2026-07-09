import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { ProgramForm } from "@/components/admin/program-form";

export const metadata: Metadata = { title: "New program" };

export default async function NewProgramPage() {
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  const { data: mentorRows } = await supabase.from("mentors").select("id");
  const ids = (mentorRows ?? []).map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  const mentors = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? "Mentor",
  }));
  const cats = (categories ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to programs
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New program
      </h1>
      <ProgramForm categories={cats} mentors={mentors} />
    </div>
  );
}
