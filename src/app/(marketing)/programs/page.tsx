import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProgramCard } from "@/components/marketing/program-card";
import { FilterBar } from "@/components/marketing/filter-bar";
import { EmptyState } from "@/components/marketing/empty-state";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Browse mentorship-led programs across admission, programming, AI, English, and career skills.",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  let query = supabase
    .from("programs")
    .select("*")
    .eq("status", "published");

  if (category && category !== "all") {
    const cat = (categories ?? []).find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: programsData } = await query
    .order("is_featured", { ascending: false })
    .limit(60);
  const programs = programsData ?? [];

  // Resolve mentor display names.
  const mentorIds = [
    ...new Set(programs.map((p) => p.mentor_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: profiles } = mentorIds.length
    ? await supabase.from("public_mentor_profiles").select("id, full_name").in("id", mentorIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...(categories ?? []).map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Learning programs
        </h1>
        <p className="mt-3 text-muted-foreground">
          Mentor-led programs designed to take you from where you are to where
          you want to be.
        </p>
      </header>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search programs…"
          filters={[
            { param: "category", placeholder: "All categories", options: categoryOptions },
          ]}
        />
      </div>

      {programs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No programs found"
            description="Try a different search term or category."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              mentorName={program.mentor_id ? nameById.get(program.mentor_id) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
