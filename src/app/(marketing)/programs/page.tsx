import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProgramCard } from "@/components/marketing/program-card";
import { FilterBar } from "@/components/marketing/filter-bar";
import { EmptyState } from "@/components/marketing/empty-state";
import { Pagination } from "@/components/marketing/pagination";
import { T } from "@/components/shared/t";
import { parsePage } from "@/lib/pagination";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Browse mentorship-led programs across admission, programming, AI, English, and career skills.",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  let query = supabase
    .from("programs")
    .select("*", { count: "exact" })
    .eq("status", "published");

  if (category && category !== "all") {
    const cat = (categories ?? []).find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (q) query = query.ilike("title", `%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const { data: programsData, count } = await query
    .order("is_featured", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const programs = programsData ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Resolve mentor display names.
  const mentorIds = [
    ...new Set(programs.map((p) => p.mentor_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: profiles } = mentorIds.length
    ? await supabase.from("public_mentor_profiles").select("id, full_name").in("id", mentorIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const allCategoriesLabel = { en: "All categories", bn: "সব ক্যাটাগরি" };
  const categoryOptions = [
    { value: "all", label: allCategoriesLabel },
    ...(categories ?? []).map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          <T en="Learning programs" bn="লার্নিং প্রোগ্রাম" />
        </h1>
        <p className="mt-3 text-muted-foreground">
          <T
            en="Mentor-led programs designed to take you from where you are to where you want to be."
            bn="মেন্টরের তত্ত্বাবধানে সাজানো প্রোগ্রাম — আপনি এখন যেখানে আছেন, সেখান থেকে লক্ষ্যে পৌঁছে দিতে।"
          />
        </p>
      </header>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder={{ en: "Search programs…", bn: "প্রোগ্রাম খুঁজুন…" }}
          filters={[
            { param: "category", placeholder: allCategoriesLabel, options: categoryOptions },
          ]}
        />
      </div>

      {programs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={<T en="No programs found" bn="কোনো প্রোগ্রাম পাওয়া যায়নি" />}
            description={
              <T
                en="Try a different search term or category."
                bn="অন্য কোনো সার্চ টার্ম বা ক্যাটাগরি দিয়ে চেষ্টা করুন।"
              />
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                mentorName={program.mentor_id ? nameById.get(program.mentor_id) : null}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
