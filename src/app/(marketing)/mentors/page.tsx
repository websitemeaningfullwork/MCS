import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MentorCard, type MentorCardData } from "@/components/marketing/mentor-card";
import { FilterBar } from "@/components/marketing/filter-bar";
import { EmptyState } from "@/components/marketing/empty-state";
import { Pagination } from "@/components/marketing/pagination";
import { T } from "@/components/shared/t";
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

  // public_mentors already filters to active, visible mentors and joins name/avatar.
  const { data: mentorRows } = await supabase
    .from("public_mentors")
    .select("id, headline, expertise, rating, reviews_count, is_verified, full_name, avatar_url, sort_order")
    .order("sort_order", { ascending: true });

  const rows = mentorRows ?? [];

  let mentors: MentorCardData[] = rows.map((m) => ({
    id: m.id,
    headline: m.headline,
    expertise: m.expertise,
    rating: m.rating,
    reviews_count: m.reviews_count,
    is_verified: m.is_verified,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }));

  // Expertise options (unique across all mentors).
  const expertiseSet = new Set<string>();
  rows.forEach((m) => (m.expertise ?? []).forEach((e) => expertiseSet.add(e)));
  const allExpertiseLabel = { en: "All expertise", bn: "সব এক্সপার্টাইজ" };
  const expertiseOptions = [
    { value: "all", label: allExpertiseLabel },
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
          <T en="Meet our mentors" bn="আমাদের মেন্টরদের সাথে পরিচিত হোন" />
        </h1>
        <p className="mt-3 text-muted-foreground">
          <T
            en="The heart of MCA. Find a mentor who fits your goals and start learning with real guidance."
            bn="MCA-র প্রাণ। আপনার লক্ষ্যের সাথে মানানসই মেন্টর খুঁজে নিন, শেখা শুরু করুন সত্যিকারের দিকনির্দেশনায়।"
          />
        </p>
      </header>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder={{ en: "Search mentors…", bn: "মেন্টর খুঁজুন…" }}
          filters={[
            { param: "expertise", placeholder: allExpertiseLabel, options: expertiseOptions },
          ]}
        />
      </div>

      {mentors.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={<T en="No mentors found" bn="কোনো মেন্টর পাওয়া যায়নি" />}
            description={
              <T
                en="Try a different search or expertise."
                bn="অন্য কোনো সার্চ বা এক্সপার্টাইজ দিয়ে চেষ্টা করুন।"
              />
            }
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
