import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MentorCard, type MentorCardData } from "@/components/marketing/mentor-card";
import { FilterBar } from "@/components/marketing/filter-bar";
import { EmptyState } from "@/components/marketing/empty-state";
import { Pagination } from "@/components/marketing/pagination";
import { parsePage } from "@/lib/pagination";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Mentors",
  description:
    "Meet the mentors of Meaningful Career Academy — experienced professionals ready to guide you.",
};

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; expertise?: string; page?: string }>;
}) {
  const { q, expertise, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  const { data: mentorRows } = await supabase
    .from("mentors")
    .select("id, headline, expertise, rating, reviews_count, is_verified");

  const rows = mentorRows ?? [];
  const ids = rows.map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("public_mentor_profiles").select("id, full_name, avatar_url").in("id", ids)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let mentors: MentorCardData[] = rows.map((m) => ({
    id: m.id,
    headline: m.headline,
    expertise: m.expertise,
    rating: m.rating,
    reviews_count: m.reviews_count,
    is_verified: m.is_verified,
    full_name: profileById.get(m.id)?.full_name ?? null,
    avatar_url: profileById.get(m.id)?.avatar_url ?? null,
  }));

  // Expertise options (unique across all mentors).
  const expertiseSet = new Set<string>();
  rows.forEach((m) => (m.expertise ?? []).forEach((e) => expertiseSet.add(e)));
  const expertiseOptions = [
    { value: "all", label: "All expertise" },
    ...[...expertiseSet].sort().map((e) => ({ value: e, label: e })),
  ];

  // Apply filters in-memory (mentor lists are small).
  if (expertise && expertise !== "all") {
    mentors = mentors.filter((m) => (m.expertise ?? []).includes(expertise));
  }
  if (q) {
    const needle = q.toLowerCase();
    mentors = mentors.filter(
      (m) =>
        (m.full_name ?? "").toLowerCase().includes(needle) ||
        (m.headline ?? "").toLowerCase().includes(needle),
    );
  }

  const totalPages = Math.max(1, Math.ceil(mentors.length / PAGE_SIZE));
  const pageMentors = mentors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Meet our mentors
        </h1>
        <p className="mt-3 text-muted-foreground">
          The heart of MCA. Find a mentor who fits your goals and start learning
          with real guidance.
        </p>
      </header>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search mentors…"
          filters={[
            { param: "expertise", placeholder: "All expertise", options: expertiseOptions },
          ]}
        />
      </div>

      {mentors.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No mentors found"
            description="Try a different search or expertise."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
