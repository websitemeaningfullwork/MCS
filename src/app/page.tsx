import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  MessageCircleQuestion,
  Mic,
  MessageSquareText,
  ListChecks,
  Play,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { createPublicClient } from "@/lib/supabase/public";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/marketing/program-card";
import { MentorCard, type MentorCardData } from "@/components/marketing/mentor-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { ContinueJourney } from "@/components/marketing/continue-journey";
import { COMMUNITY } from "@/lib/constants";

// The public homepage renders only anon-readable content, so it is statically
// prerendered and revalidated every 5 minutes (served from the CDN). Auth-aware
// UI ("Continue Your Journey" + navbar) lives in client islands, so nothing on
// the server path depends on the signed-in user.
export const revalidate = 300;

// --- Static homepage content -------------------------------------------------

const FEATURES = [
  {
    title: "Courses",
    description: "Expert-designed courses to power your future.",
    href: "/programs",
    icon: GraduationCap,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Expert Mentors",
    description: "Learn from experienced professionals.",
    href: "/mentors",
    icon: Users,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "E-Books",
    description: "Read. Learn. Grow anytime, anywhere.",
    href: "/resources",
    icon: BookOpen,
    tint: "bg-amber-400/15 text-amber-500 dark:text-amber-400",
  },
  {
    title: "Live Classes",
    description: "Join interactive live sessions.",
    href: "/live-classes",
    icon: Video,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Ask a Mentor",
    description: "Get your answers from our experts.",
    href: "/dashboard/questions/new",
    icon: MessageCircleQuestion,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
] as const;

const ASK_OPTIONS = [
  {
    title: "Ask with Text",
    description: "Type your question and get a thoughtful written answer.",
    href: "/dashboard/questions/new",
    icon: MessageSquareText,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ring: "hover:border-blue-500/40",
  },
  {
    title: "Ask with Voice",
    description: "Record your question and let a mentor guide you back.",
    href: "/dashboard/questions/new",
    icon: Mic,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    ring: "hover:border-violet-500/40",
  },
  {
    title: "My Questions",
    description: "Track your questions and revisit mentor answers.",
    href: "/dashboard/questions",
    icon: ListChecks,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    ring: "hover:border-orange-500/40",
  },
] as const;

const STATS = [
  {
    label: "Happy Students",
    value: "5,000+",
    icon: Users,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    label: "E-Books",
    value: "120+",
    icon: BookOpen,
    tint: "bg-amber-400/15 text-amber-500 dark:text-amber-400",
  },
  {
    label: "Success Rate",
    value: "94%",
    icon: TrendingUp,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Questions Answered",
    value: "25,000+",
    icon: MessageCircleQuestion,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
] as const;

export default async function HomePage() {
  const supabase = createPublicClient();

  const [programsRes, mentorRowsRes] = await Promise.all([
    supabase
      .from("programs")
      .select("*")
      .eq("status", "published")
      .eq("is_featured", true)
      .limit(6),
    supabase
      .from("mentors")
      .select("id, headline, expertise, rating, reviews_count, is_verified")
      .eq("is_featured", true)
      .limit(4),
  ]);

  const programs = programsRes.data ?? [];
  const mentorRows = mentorRowsRes.data ?? [];

  // Resolve mentor display names/photos (public read of mentor profiles).
  const mentorIds = new Set<string>();
  mentorRows.forEach((m) => mentorIds.add(m.id));
  programs.forEach((p) => p.mentor_id && mentorIds.add(p.mentor_id));

  const profilesRes = mentorIds.size
    ? await supabase
        .from("public_mentor_profiles")
        .select("id, full_name, avatar_url")
        .in("id", [...mentorIds])
    : { data: [] };
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  const mentors: MentorCardData[] = mentorRows.map((m) => ({
    id: m.id,
    headline: m.headline,
    expertise: m.expertise,
    rating: m.rating,
    reviews_count: m.reviews_count,
    is_verified: m.is_verified,
    full_name: profileById.get(m.id)?.full_name ?? null,
    avatar_url: profileById.get(m.id)?.avatar_url ?? null,
  }));

  return (
    <>
      {/* ===================================================================
          1. HERO — full-bleed, floating navbar overlaps this section.
          =================================================================== */}
      <section className="hero-surface relative -mt-24 w-full overflow-hidden">
        {/* Decorative soft glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/3 top-1/2 size-72 rounded-full bg-sky-300/20 blur-3xl"
        />

        {/* Full-bleed student image on the right (desktop) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] lg:block">
          <Image
            src="/images/hero-mentor-student.webp"
            alt="A student learning on a laptop with mentor guidance"
            fill
            priority
            sizes="48vw"
            className="object-cover object-center"
          />
          {/* Left fade so the photo melts into the hero surface */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="max-w-xl pt-32 pb-24 lg:pt-40 lg:pb-40">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Learn Today,
              <br />
              <span className="text-gradient-blue">Lead Tomorrow.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Your trusted learning companion to grow, achieve, and make your
              dreams a reality.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-600/25 transition-shadow hover:shadow-xl hover:shadow-blue-600/40"
              >
                <Link href="/mentors">
                  Find Your Mentor
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full bg-card/70 backdrop-blur"
              >
                <Link href="/live-classes">
                  <Play className="size-4 fill-current" />
                  Watch Overview
                </Link>
              </Button>
            </div>
          </div>

          {/* Mobile hero image */}
          <div className="relative -mt-8 mb-4 aspect-[4/3] overflow-hidden rounded-3xl shadow-card lg:hidden">
            <Image
              src="/images/hero-mentor-student.webp"
              alt="A student learning on a laptop with mentor guidance"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. FEATURE CARDS — colorful, overlapping the hero.
          =================================================================== */}
      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {FEATURES.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-colors hover:bg-secondary/60"
                >
                  <span
                    className={`flex size-14 items-center justify-center rounded-2xl ${feature.tint} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="size-7" />
                  </span>
                  <span className="font-semibold text-foreground">
                    {feature.title}
                  </span>
                  <span className="text-sm leading-snug text-muted-foreground">
                    {feature.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Constrained content column for the rest of the page. */}
      <div className="mx-auto max-w-6xl px-4">
        {/* =================================================================
            5. POPULAR PROGRAMS
            ================================================================= */}
        {programs.length > 0 ? (
          <section className="pt-20">
            <Reveal>
              <SectionHeading
                eyebrow="Featured"
                title="Popular Programs"
                description="Hand-picked programs students love right now."
                href="/programs"
              />
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program, i) => (
                <Reveal key={program.id} delay={i * 0.05}>
                  <ProgramCard
                    program={program}
                    mentorName={
                      program.mentor_id
                        ? profileById.get(program.mentor_id)?.full_name
                        : null
                    }
                  />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* =================================================================
            Meet our mentors
            ================================================================= */}
        {mentors.length > 0 ? (
          <section className="pt-20">
            <Reveal>
              <SectionHeading
                eyebrow="The heart of MCA"
                title="Meet Our Mentors"
                description="Experienced professionals ready to guide you personally."
                href="/mentors"
              />
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {mentors.map((mentor, i) => (
                <Reveal key={mentor.id} delay={i * 0.05}>
                  <MentorCard mentor={mentor} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* =================================================================
            6. CONTINUE YOUR JOURNEY (auth-aware island)
            ================================================================= */}
        <section className="pt-20">
          <Reveal>
            <SectionHeading
              eyebrow="Keep going"
              title="Continue Your Journey"
              description="Pick up right where you left off."
            />
          </Reveal>
          <ContinueJourney />
        </section>

        {/* =================================================================
            7. ASK A MENTOR
            ================================================================= */}
        <section className="pt-20">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Personal support"
              title="Ask a Mentor"
              description="Stuck on something? Reach a real mentor your way."
            />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ASK_OPTIONS.map((opt, i) => (
              <Reveal key={opt.title} delay={i * 0.05}>
                <Link
                  href={opt.href}
                  className={`card-hover flex h-full flex-col items-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-card ${opt.ring}`}
                >
                  <span
                    className={`flex size-12 items-center justify-center rounded-2xl ${opt.tint}`}
                  >
                    <opt.icon className="size-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {opt.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Get started
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          {COMMUNITY.whatsapp ? (
            <Reveal>
              <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:flex-row">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MessageCircleQuestion className="size-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Need a quick reply?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chat with our support team on WhatsApp.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <a
                    href={COMMUNITY.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open WhatsApp
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </Reveal>
          ) : null}
        </section>

        {/* =================================================================
            8. STATISTICS
            ================================================================= */}
        <section className="py-20">
          <Reveal>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-500/5 via-card to-sky-400/5 p-8 shadow-card sm:p-12">
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                {STATS.map((stat, i) => (
                  <Reveal key={stat.label} delay={i * 0.05}>
                    <div className="flex flex-col items-center text-center">
                      <span
                        className={`flex size-14 items-center justify-center rounded-2xl ${stat.tint}`}
                      >
                        <stat.icon className="size-7" />
                      </span>
                      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  );
}
