import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Briefcase, MessageCircleQuestion, Star } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgramCard } from "@/components/marketing/program-card";

async function getMentor(id: string) {
  const supabase = await createClient();
  const [{ data: mentor }, { data: profile }] = await Promise.all([
    supabase
      .from("mentors")
      .select(
        "id, headline, expertise, skills, rating, reviews_count, is_verified, years_experience",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("public_mentor_profiles")
      .select("id, full_name, avatar_url, bio")
      .eq("id", id)
      .maybeSingle(),
  ]);
  return { mentor, profile };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { profile, mentor } = await getMentor(id);
  if (!profile) return { title: "Mentor not found" };
  return {
    title: profile.full_name ?? "Mentor",
    description: mentor?.headline ?? undefined,
  };
}

function initials(name: string | null): string {
  if (!name) return "M";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();
}

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { mentor, profile } = await getMentor(id);
  if (!mentor || !profile) notFound();

  const [{ data: programs }, { data: { user } }] = await Promise.all([
    supabase
      .from("programs")
      .select("*")
      .eq("mentor_id", id)
      .eq("status", "published"),
    supabase.auth.getUser(),
  ]);

  const askHref = user
    ? `/dashboard/questions/new?mentor=${id}`
    : `/login?next=${encodeURIComponent(`/dashboard/questions/new?mentor=${id}`)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar className="size-24 border border-border">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Mentor"} />
          ) : null}
          <AvatarFallback className="bg-secondary text-2xl font-semibold text-foreground">
            {initials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {profile.full_name ?? "MCA Mentor"}
            </h1>
            {mentor.is_verified ? (
              <BadgeCheck className="size-5 text-primary" aria-label="Verified" />
            ) : null}
          </div>
          {mentor.headline ? (
            <p className="mt-1 text-primary">{mentor.headline}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {mentor.rating && mentor.rating > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">
                  {mentor.rating.toFixed(1)}
                </span>
                {mentor.reviews_count ? <span>({mentor.reviews_count})</span> : null}
              </span>
            ) : null}
            {mentor.years_experience ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="size-4" />
                {mentor.years_experience}+ years
              </span>
            ) : null}
          </div>
        </div>

        <Button asChild size="lg" className="rounded-full">
          <Link href={askHref}>
            <MessageCircleQuestion className="size-4" />
            Ask a Question
          </Link>
        </Button>
      </div>

      {/* Bio */}
      {profile.bio ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        </section>
      ) : null}

      {/* Expertise + skills */}
      {(mentor.expertise && mentor.expertise.length > 0) ||
      (mentor.skills && mentor.skills.length > 0) ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Expertise</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {[...(mentor.expertise ?? []), ...(mentor.skills ?? [])].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Programs by mentor */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">
          Programs by {profile.full_name ?? "this mentor"}
        </h2>
        {programs && programs.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                mentorName={profile.full_name}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No published programs yet.
          </p>
        )}
      </section>
    </div>
  );
}
