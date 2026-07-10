import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ResourceCard, RESOURCE_KIND_LABELS } from "@/components/marketing/resource-card";
import { FilterBar } from "@/components/marketing/filter-bar";
import { EmptyState } from "@/components/marketing/empty-state";
import { Pagination, parsePage } from "@/components/marketing/pagination";
import type { Enums } from "@/types/database.types";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "E-books & Resources",
  description:
    "Premium e-books, CV templates, roadmaps, and career resources from Meaningful Career Academy.",
};

const KIND_OPTIONS = [
  { value: "all", label: "All resources" },
  ...Object.entries(RESOURCE_KIND_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; page?: string }>;
}) {
  const { q, kind, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  let query = supabase.from("public_resources").select("*", { count: "exact" });
  if (kind && kind !== "all" && kind in RESOURCE_KIND_LABELS) {
    query = query.eq("kind", kind as Enums<"resource_kind">);
  }
  if (q) query = query.ilike("title", `%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query
    .order("is_featured", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const resources = data ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          E-books &amp; resources
        </h1>
        <p className="mt-3 text-muted-foreground">
          Premium learning materials, templates, and roadmaps to support your
          journey.
        </p>
      </header>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search resources…"
          filters={[{ param: "kind", placeholder: "All resources", options: KIND_OPTIONS }]}
        />
      </div>

      {resources.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No resources found"
            description="Try a different search or category."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
