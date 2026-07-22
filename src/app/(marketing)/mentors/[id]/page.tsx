import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  GraduationCap,
  Mail,
  MessageCircleQuestion,
  Phone,
  Star,
} from "lucide-react";
import {
  FacebookIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgramCard } from "@/components/marketing/program-card";
import { formatBDT } from "@/lib/format";
import {
  WEEKDAYS,
  SESSION_DURATIONS,
  DEFAULT_AVAILABILITY,
  type Availability,
} from "@/features/admin/mentor-schema";

async function getMentor(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_mentors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mentor = await getMentor(id);
  if (!mentor) return { title: "Mentor not found" };
  return {
    title: mentor.full_name ?? "Mentor",
    description: mentor.headline ?? undefined,
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

function durationLabel(mins: number | null): string | null {
  if (!mins) return null;
  return SESSION_DURATIONS.find((d) => d.value === mins)?.label ?? `${mins} minutes`;
}

function toAvailability(raw: unknown): Availability | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  if (!Array.isArray(a.working_days) || a.working_days.length === 0) return null;
  return {
    working_days: a.working_days as Availability["working_days"],
    start_time: typeof a.start_time === "string" ? a.start_time : DEFAULT_AVAILABILITY.start_time,
    end_time: typeof a.end_time === "string" ? a.end_time : DEFAULT_AVAILABILITY.end_time,
    breaks: [],
  };
}

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const mentor = await getMentor(id);
  if (!mentor) notFound();

  const [{ data: programs }, { data: { user } }] = await Promise.all([
    supabase.from("programs").select("*").eq("mentor_id", id).eq("status", "published"),
    supabase.auth.getUser(),
  ]);

  const askHref = user
    ? `/dashboard/questions/new?mentor=${id}`
    : `/login?next=${encodeURIComponent(`/dashboard/questions/new?mentor=${id}`)}`;

  const availability = toAvailability(mentor.availability);
  const workingDayLabels = availability
    ? WEEKDAYS.filter((d) => availability.working_days.includes(d.key)).map((d) => d.label)
    : [];
  const duration = durationLabel(mentor.session_duration);
  const tags = [...(mentor.expertise ?? []), ...(mentor.skills ?? [])];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar className="size-24 border border-border">
          {mentor.avatar_url ? (
            <AvatarImage src={mentor.avatar_url} alt={mentor.full_name ?? "Mentor"} />
          ) : null}
          <AvatarFallback className="bg-secondary text-2xl font-semibold text-foreground">
            {initials(mentor.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {mentor.full_name ?? "MCA Mentor"}
            </h1>
            {mentor.is_verified ? (
              <BadgeCheck className="size-5 text-primary" aria-label="Verified" />
            ) : null}
          </div>
          {mentor.headline ? <p className="mt-1 text-primary">{mentor.headline}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {mentor.rating && mentor.rating > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">{mentor.rating.toFixed(1)}</span>
                {mentor.reviews_count ? <span>({mentor.reviews_count})</span> : null}
              </span>
            ) : null}
            {mentor.years_experience ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="size-4" />
                {mentor.years_experience}+ years
              </span>
            ) : null}
            {mentor.current_position ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="size-4" />
                {mentor.current_position}
                {mentor.organization ? ` · ${mentor.organization}` : ""}
              </span>
            ) : null}
            {mentor.highest_qualification ? (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-4" />
                {mentor.highest_qualification}
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

      {/* Session / availability / contact cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentor.session_price_bdt && mentor.session_price_bdt > 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CalendarClock className="size-4 text-primary" />
              1-on-1 Session
            </h3>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {formatBDT(mentor.session_price_bdt)}
            </p>
            {duration ? <p className="text-sm text-muted-foreground">{duration}</p> : null}
          </div>
        ) : null}

        {availability ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Availability</h3>
            <p className="mt-2 text-sm text-muted-foreground">{workingDayLabels.join(", ")}</p>
            <p className="text-sm text-muted-foreground">
              {availability.start_time} – {availability.end_time}
            </p>
          </div>
        ) : null}

        {mentor.phone || mentor.whatsapp || mentor.email ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {mentor.phone ? (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  {mentor.phone}
                </li>
              ) : null}
              {mentor.whatsapp ? (
                <li className="flex items-center gap-2">
                  <MessageCircleQuestion className="size-4 text-success" />
                  {mentor.whatsapp}
                </li>
              ) : null}
              {mentor.email ? (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  {mentor.email}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Bio */}
      {mentor.bio ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
            {mentor.bio}
          </p>
        </section>
      ) : null}

      {/* Expertise + skills */}
      {tags.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Expertise</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
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

      {/* Social links */}
      {mentor.facebook_url || mentor.youtube_url || mentor.linkedin_url ? (
        <section className="mt-8 flex flex-wrap gap-3">
          {mentor.facebook_url ? (
            <SocialLink href={mentor.facebook_url} icon="facebook" label="Facebook" />
          ) : null}
          {mentor.youtube_url ? (
            <SocialLink href={mentor.youtube_url} icon="youtube" label="YouTube" />
          ) : null}
          {mentor.linkedin_url ? (
            <SocialLink href={mentor.linkedin_url} icon="linkedin" label="LinkedIn" />
          ) : null}
        </section>
      ) : null}

      {/* Programs by mentor */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">
          Programs by {mentor.full_name ?? "this mentor"}
        </h2>
        {programs && programs.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} mentorName={mentor.full_name} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No published programs yet.</p>
        )}
      </section>
    </div>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "facebook" | "youtube" | "linkedin";
  label: string;
}) {
  const Icon = icon === "facebook" ? FacebookIcon : icon === "youtube" ? YoutubeIcon : LinkedinIcon;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="size-4" />
      {label}
    </a>
  );
}
