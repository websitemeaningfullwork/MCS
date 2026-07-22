import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  ResourceCard,
  RESOURCE_KIND_LABELS,
  RESOURCE_KIND_LABELS_BI,
} from "@/components/marketing/resource-card";
import { FilterBar } from "@/components/marketing/filter-bar";
import { EmptyState } from "@/components/marketing/empty-state";
import { Pagination } from "@/components/marketing/pagination";
import { T } from "@/components/shared/t";
import { parsePage } from "@/lib/pagination";
import type { Enums } from "@/types/database.types";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "E-books & Resources",
  description:
    "Premium e-books, CV templates, roadmaps, and career resources from Meaningful Career Academy.",
};

const ALL_RESOURCES_LABEL = { en: "All resources", bn: "সব রিসোর্স" };
const KIND_OPTIONS = [
  { value: "all", label: ALL_RESOURCES_LABEL },
  ...Object.entries(RESOURCE_KIND_LABELS_BI).map(([value, label]) => ({
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
          <T en="E-books & resources" bn="ই-বুক ও রিসোর্স" />
        </h1>
        <p className="mt-3 text-muted-foreground">
          <T
            en="Premium learning materials, templates, and roadmaps to support your journey."
            bn="আপনার যাত্রায় সহায়ক প্রিমিয়াম লার্নিং ম্যাটেরিয়াল, টেমপ্লেট ও রোডম্যাপ।"
          />
        </p>
      </header>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder={{ en: "Search resources…", bn: "রিসোর্স খুঁজুন…" }}
          filters={[{ param: "kind", placeholder: ALL_RESOURCES_LABEL, options: KIND_OPTIONS }]}
        />
      </div>

      {resources.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={<T en="No resources found" bn="কোনো রিসোর্স পাওয়া যায়নি" />}
            description={
              <T
                en="Try a different search or category."
                bn="অন্য কোনো সার্চ বা ক্যাটাগরি দিয়ে চেষ্টা করুন।"
              />
            }
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
