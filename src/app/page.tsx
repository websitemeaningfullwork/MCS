import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  MessageCircleQuestion,
  Mic,
  MessageSquareText,
  ListChecks,
  Play,
  Radio,
  Route,
  TrendingUp,
  UserRound,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

import { createPublicClient } from "@/lib/supabase/public";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/marketing/program-card";
import { MentorCard, type MentorCardData } from "@/components/marketing/mentor-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { ContinueJourney } from "@/components/marketing/continue-journey";
import {
  TestimonialCarousel,
  type TestimonialItem,
} from "@/components/marketing/testimonial-carousel";
import { AchievementsGallery } from "@/components/marketing/achievements-gallery";
import { T } from "@/components/shared/t";
import { COMMUNITY, WHY_MCA } from "@/lib/constants";
import type { Bi } from "@/lib/i18n";

// Icon registry for the "Why MCA" pillars (WHY_MCA stores string keys).
const PILLAR_ICONS: Record<string, LucideIcon> = {
  "user-round": UserRound,
  radio: Radio,
  route: Route,
  briefcase: Briefcase,
};

// The public homepage renders only anon-readable content, so it is statically
// prerendered and revalidated every 5 minutes (served from the CDN). Auth-aware
// UI ("Continue Your Journey" + navbar) lives in client islands, so nothing on
// the server path depends on the signed-in user. Copy is bilingual via the
// tiny <T> client leaf — the page itself stays static.
export const revalidate = 300;

// --- Static homepage content -------------------------------------------------

// Hero glass-panel bullets (staggered slide-in) and inline stats strip.
const HERO_FEATURES: readonly { label: Bi; icon: LucideIcon }[] = [
  {
    label: { en: "1-on-1 guidance from expert mentors", bn: "অভিজ্ঞ মেন্টরদের ১-অন-১ গাইডেন্স" },
    icon: Users,
  },
  {
    label: { en: "Live classes & career-focused courses", bn: "লাইভ ক্লাস ও ক্যারিয়ারমুখী কোর্স" },
    icon: Radio,
  },
  {
    label: { en: "E-books, mock tests & roadmaps", bn: "ই-বুক, মক টেস্ট ও রোডম্যাপ" },
    icon: BookOpen,
  },
] as const;

const HERO_STATS: readonly { value: string; label: Bi }[] = [
  { value: "5,000+", label: { en: "Students", bn: "শিক্ষার্থী" } },
  { value: "120+", label: { en: "Programs", bn: "প্রোগ্রাম" } },
  { value: "94%", label: { en: "Success Rate", bn: "সাফল্যের হার" } },
] as const;

const FEATURES: readonly {
  title: Bi;
  description: Bi;
  href: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  {
    title: { en: "Courses", bn: "কোর্সসমূহ" },
    description: {
      en: "Expert-designed courses to power your future.",
      bn: "আপনার ভবিষ্যৎ গড়ে তুলতে এক্সপার্টদের সাজানো কোর্স।",
    },
    href: "/programs",
    icon: GraduationCap,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: { en: "Expert Mentors", bn: "অভিজ্ঞ মেন্টর" },
    description: {
      en: "Learn from experienced professionals.",
      bn: "অভিজ্ঞ প্রফেশনালদের কাছ থেকে শিখুন।",
    },
    href: "/mentors",
    icon: Users,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: { en: "E-Books", bn: "ই-বুক" },
    description: {
      en: "Read. Learn. Grow anytime, anywhere.",
      bn: "পড়ুন, শিখুন — যেকোনো সময়, যেকোনো জায়গা থেকে।",
    },
    href: "/resources",
    icon: BookOpen,
    tint: "bg-amber-400/15 text-amber-500 dark:text-amber-400",
  },
  {
    title: { en: "Live Classes", bn: "লাইভ ক্লাস" },
    description: {
      en: "Join interactive live sessions.",
      bn: "ইন্টারঅ্যাকটিভ লাইভ সেশনে যোগ দিন।",
    },
    href: "/live-classes",
    icon: Video,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: { en: "Ask a Mentor", bn: "মেন্টরকে প্রশ্ন করুন" },
    description: {
      en: "Get your answers from our experts.",
      bn: "আমাদের এক্সপার্টদের কাছ থেকে উত্তর নিন।",
    },
    href: "/dashboard/questions/new",
    icon: MessageCircleQuestion,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
] as const;

const ASK_OPTIONS: readonly {
  title: Bi;
  description: Bi;
  href: string;
  icon: LucideIcon;
  tint: string;
  ring: string;
}[] = [
  {
    title: { en: "Ask with Text", bn: "লিখে প্রশ্ন করুন" },
    description: {
      en: "Type your question and get a thoughtful written answer.",
      bn: "আপনার প্রশ্ন লিখুন, মেন্টরের কাছ থেকে গুছিয়ে লেখা উত্তর পান।",
    },
    href: "/dashboard/questions/new",
    icon: MessageSquareText,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ring: "hover:border-blue-500/40",
  },
  {
    title: { en: "Ask with Voice", bn: "ভয়েসে প্রশ্ন করুন" },
    description: {
      en: "Record your question and let a mentor guide you back.",
      bn: "প্রশ্ন রেকর্ড করে পাঠান, মেন্টর আপনাকে পথ দেখিয়ে দেবেন।",
    },
    href: "/dashboard/questions/new",
    icon: Mic,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    ring: "hover:border-violet-500/40",
  },
  {
    title: { en: "My Questions", bn: "আমার প্রশ্ন" },
    description: {
      en: "Track your questions and revisit mentor answers.",
      bn: "আপনার প্রশ্নগুলো ট্র্যাক করুন, মেন্টরের উত্তর আবার দেখে নিন।",
    },
    href: "/dashboard/questions",
    icon: ListChecks,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    ring: "hover:border-orange-500/40",
  },
] as const;

const STATS: readonly {
  label: Bi;
  value: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  {
    label: { en: "Happy Students", bn: "সন্তুষ্ট শিক্ষার্থী" },
    value: "5,000+",
    icon: Users,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    label: { en: "E-Books", bn: "ই-বুক" },
    value: "120+",
    icon: BookOpen,
    tint: "bg-amber-400/15 text-amber-500 dark:text-amber-400",
  },
  {
    label: { en: "Success Rate", bn: "সাফল্যের হার" },
    value: "94%",
    icon: TrendingUp,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    label: { en: "Questions Answered", bn: "উত্তর দেওয়া প্রশ্ন" },
    value: "25,000+",
    icon: MessageCircleQuestion,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
] as const;

export default async function HomePage() {
  const supabase = createPublicClient();

  const [programsRes, mentorRowsRes, reviewsRes] = await Promise.all([
    supabase
      .from("programs")
      .select("*")
      .eq("status", "published")
      .eq("is_featured", true)
      .limit(6),
    supabase
      .from("public_mentors")
      .select("id, headline, expertise, rating, reviews_count, is_verified, full_name, avatar_url")
      .eq("is_featured", true)
      .order("sort_order", { ascending: true })
      .limit(4),
    // Approved course reviews with a written body → Student Success Stories.
    supabase
      .from("public_reviews")
      .select("id, rating, body, reviewer_name, program_title, verified_buyer")
      .eq("scope", "course")
      .not("body", "is", null)
      .order("created_at", { ascending: false })
      .limit(9),
  ]);

  const programs = programsRes.data ?? [];
  const mentorRows = mentorRowsRes.data ?? [];

  // Real testimonials (the carousel falls back to bilingual seed copy when
  // none are approved yet).
  const testimonials: TestimonialItem[] = (reviewsRes.data ?? [])
    .filter((r) => (r.body ?? "").trim().length > 0)
    .map((r) => ({
      name: r.reviewer_name ?? "MCA Student",
      role: r.program_title ?? "MCA Student",
      rating: r.rating,
      quote: r.body ?? "",
    }));

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
          1. HERO — gogee8-style split: frosted glass panel (typing headline,
          staggered feature bullets, ripple CTA) + 3D-tilted media card with
          inline stats. Floating blurred blobs drift behind everything.
          =================================================================== */}
      <section className="hero-surface relative -mt-24 w-full overflow-hidden">
        {/* Animated blurred blobs (hidden on small screens for performance) */}
        <div
          aria-hidden
          className="blur-shape -left-24 -top-24 hidden size-[400px] bg-gradient-to-br from-blue-600 to-sky-400 sm:block"
        />
        <div
          aria-hidden
          className="blur-shape -bottom-12 -right-12 hidden size-[300px] bg-gradient-to-br from-sky-400 to-blue-500 [animation-delay:10s] sm:block"
        />
        <div
          aria-hidden
          className="blur-shape left-1/2 top-1/2 size-[250px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-500 to-cyan-400 [animation-delay:5s]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-32 lg:grid-cols-2 lg:gap-14 lg:pb-28 lg:pt-40">
          {/* Left — frosted glass content panel slides in from the left. */}
          <div className="anim-slide-in-left glass-card rounded-[30px] p-7 text-center sm:p-10 lg:text-left">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              <T en="Learn Today," bn="আজ শিখুন," />
              <br />
              <span className="typing-text text-gradient-blue pr-1">
                <T en="Lead Tomorrow." bn="আগামীর নেতৃত্ব দিন।" />
              </span>
            </h1>

            <p className="anim-fade-in-up mx-auto mt-5 max-w-md text-lg text-muted-foreground [animation-delay:0.5s] lg:mx-0">
              <T
                en="Your trusted learning companion to grow, achieve, and make your dreams a reality."
                bn="আপনার বিশ্বস্ত শেখার সঙ্গী — এগিয়ে যেতে, অর্জন করতে এবং স্বপ্নকে বাস্তবে রূপ দিতে।"
              />
            </p>

            {/* Feature bullets slide in one after another. */}
            <ul className="mt-7 space-y-4 text-left">
              {HERO_FEATURES.map((f, i) => (
                <li
                  key={f.label.en}
                  className="anim-slide-in-feature flex items-center gap-4"
                  style={{ animationDelay: `${1 + i * 0.2}s` }}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_5px_15px_rgba(37,99,235,0.3)]">
                    <f.icon className="size-5" />
                  </span>
                  <span className="font-medium text-foreground">
                    <T {...f.label} />
                  </span>
                </li>
              ))}
            </ul>

            <div className="anim-fade-in-up mt-8 flex flex-col justify-center gap-3 [animation-delay:1.8s] sm:flex-row lg:justify-start">
              <Button
                asChild
                size="lg"
                className="btn-ripple rounded-full bg-gradient-to-r from-blue-600 to-sky-500 shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/40"
              >
                <Link href="/mentors">
                  <T en="Find Your Mentor" bn="আপনার মেন্টর খুঁজুন" />
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full bg-card/70 backdrop-blur transition-transform duration-300 hover:-translate-y-1"
              >
                <Link href="/live-classes">
                  <Play className="size-4 fill-current" />
                  <T en="Watch Overview" bn="ওভারভিউ দেখুন" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — 3D-tilted frosted media card that flattens on hover. */}
          <div className="anim-slide-in-right">
            <div className="tilt-3d glass-card rounded-[25px] p-4 sm:p-6">
              <div className="relative aspect-video overflow-hidden rounded-[20px] shadow-[0_15px_40px_rgba(15,23,42,0.2)]">
                <Image
                  src="/images/hero-mentor-student.webp"
                  alt="A student learning on a laptop with mentor guidance"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              {/* Inline stats strip inside the glass panel. */}
              <div className="mt-5 flex justify-between gap-2 rounded-[20px] border border-white/20 bg-card/40 p-4 backdrop-blur-md sm:p-5 dark:border-white/10">
                {HERO_STATS.map((s) => (
                  <div key={s.label.en} className="min-w-0 text-center">
                    <span className="block text-xl font-bold text-primary sm:text-2xl">
                      {s.value}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                      <T {...s.label} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                  key={feature.title.en}
                  href={feature.href}
                  className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-secondary/40 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-[0_8px_20px_rgba(37,99,235,0.1)]"
                >
                  <span
                    className={`flex size-14 items-center justify-center rounded-2xl ${feature.tint} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="size-7" />
                  </span>
                  <span className="font-semibold text-foreground">
                    <T {...feature.title} />
                  </span>
                  <span className="text-sm leading-snug text-muted-foreground">
                    <T {...feature.description} />
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
            ABOUT MCA — mission + "Why MCA" pillars (gogee "About" section).
            ================================================================= */}
        <section className="pt-20">
          <Reveal>
            <SectionHeading
              eyebrow={<T en="Why MCA" bn="কেন MCA" />}
              title={<T en="Guidance, not just courses." bn="শুধু কোর্স নয়, দিকনির্দেশনা।" />}
              description={
                <T
                  en="MCA is a mentorship-first platform. Every course, live class, e-book, and mock test exists to support a real relationship with a mentor who guides you toward a meaningful career."
                  bn="MCA একটি মেন্টরশিপ-ফার্স্ট প্ল্যাটফর্ম। প্রতিটি কোর্স, লাইভ ক্লাস, ই-বুক ও মক টেস্ট আছে একটাই লক্ষ্যে — একজন মেন্টরের সাথে আপনার সত্যিকারের সম্পর্ক গড়া, যিনি আপনাকে অর্থবহ ক্যারিয়ারের পথে এগিয়ে নেবেন।"
                />
              }
              href="/about"
              linkLabel={<T en="Learn more" bn="আরও জানুন" />}
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_MCA.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.icon] ?? UserRound;
              return (
                <Reveal key={pillar.title.en} delay={i * 0.05}>
                  <div className="card-hover flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-card">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        <T {...pillar.title} />
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <T {...pillar.description} />
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* =================================================================
            5. POPULAR PROGRAMS
            ================================================================= */}
        {programs.length > 0 ? (
          <section className="pt-20">
            <Reveal>
              <SectionHeading
                eyebrow={<T en="Featured" bn="ফিচার্ড" />}
                title={<T en="Popular Programs" bn="জনপ্রিয় প্রোগ্রাম" />}
                description={
                  <T
                    en="Hand-picked programs students love right now."
                    bn="শিক্ষার্থীদের এই মুহূর্তের পছন্দের বাছাই করা প্রোগ্রাম।"
                  />
                }
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
                eyebrow={<T en="The heart of MCA" bn="MCA-র প্রাণ" />}
                title={<T en="Meet Our Mentors" bn="আমাদের মেন্টরদের সাথে পরিচিত হোন" />}
                description={
                  <T
                    en="Experienced professionals ready to guide you personally."
                    bn="অভিজ্ঞ প্রফেশনালরা প্রস্তুত আপনাকে ব্যক্তিগতভাবে গাইড করতে।"
                  />
                }
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
            STUDENT SUCCESS STORIES — testimonial carousel (gogee "Reviews").
            ================================================================= */}
        <section className="pt-20">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow={<T en="Loved by learners" bn="শিক্ষার্থীদের ভালোবাসায়" />}
              title={<T en="Student Success Stories" bn="শিক্ষার্থীদের সাফল্যের গল্প" />}
              description={
                <T
                  en="Real words from students who found direction with a mentor by their side."
                  bn="মেন্টরকে পাশে পেয়ে পথ খুঁজে পাওয়া শিক্ষার্থীদের নিজেদের কথা।"
                />
              }
            />
          </Reveal>
          <Reveal className="mt-10">
            <TestimonialCarousel items={testimonials} />
          </Reveal>
        </section>

        {/* =================================================================
            6. CONTINUE YOUR JOURNEY (auth-aware island)
            ================================================================= */}
        <section className="pt-20">
          <Reveal>
            <SectionHeading
              eyebrow={<T en="Keep going" bn="এগিয়ে চলুন" />}
              title={<T en="Continue Your Journey" bn="আপনার যাত্রা চালিয়ে যান" />}
              description={
                <T
                  en="Pick up right where you left off."
                  bn="যেখানে থেমেছিলেন, ঠিক সেখান থেকেই আবার শুরু করুন।"
                />
              }
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
              eyebrow={<T en="Personal support" bn="ব্যক্তিগত সাপোর্ট" />}
              title={<T en="Ask a Mentor" bn="মেন্টরকে প্রশ্ন করুন" />}
              description={
                <T
                  en="Stuck on something? Reach a real mentor your way."
                  bn="কোথাও আটকে গেছেন? আপনার সুবিধামতো উপায়ে একজন সত্যিকারের মেন্টরের কাছে পৌঁছে যান।"
                />
              }
            />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ASK_OPTIONS.map((opt, i) => (
              <Reveal key={opt.title.en} delay={i * 0.05}>
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
                      <T {...opt.title} />
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <T {...opt.description} />
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <T en="Get started" bn="শুরু করুন" />
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
                      <T en="Need a quick reply?" bn="দ্রুত উত্তর দরকার?" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <T
                        en="Chat with our support team on WhatsApp."
                        bn="হোয়াটসঅ্যাপে আমাদের সাপোর্ট টিমের সাথে কথা বলুন।"
                      />
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
                    <T en="Open WhatsApp" bn="হোয়াটসঅ্যাপ খুলুন" />
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </Reveal>
          ) : null}
        </section>

        {/* =================================================================
            ACHIEVEMENTS / WINNERS — gallery carousel (gogee "Winners").
            ================================================================= */}
        <section className="pt-20">
          <Reveal>
            <SectionHeading
              eyebrow={<T en="Winners' circle" bn="বিজয়ীদের আসর" />}
              title={<T en="Where Our Students Are Now" bn="আমাদের শিক্ষার্থীরা আজ কোথায়" />}
              description={
                <T
                  en="A snapshot of recent wins from across the MCA community."
                  bn="MCA কমিউনিটির সাম্প্রতিক সাফল্যের এক ঝলক।"
                />
              }
              href="/programs"
              linkLabel={<T en="Start your journey" bn="আপনার যাত্রা শুরু করুন" />}
            />
          </Reveal>
          <Reveal className="mt-10">
            <AchievementsGallery />
          </Reveal>
        </section>

        {/* =================================================================
            8. STATISTICS
            ================================================================= */}
        <section className="py-20">
          <Reveal>
            <div className="rounded-[25px] border border-white/30 bg-gradient-to-br from-blue-600/10 via-card/60 to-sky-400/10 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 sm:p-12">
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                {STATS.map((stat, i) => (
                  <Reveal key={stat.label.en} delay={i * 0.05}>
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
                        <T {...stat.label} />
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
