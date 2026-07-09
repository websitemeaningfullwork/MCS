import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircleQuestion,
  Sparkles,
  Star,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/marketing/program-card";
import { MentorCard, type MentorCardData } from "@/components/marketing/mentor-card";
import { CategoryIcon, getIcon } from "@/components/marketing/category-icon";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { WHY_MCA, TESTIMONIALS, COMMUNITY } from "@/lib/constants";
import { formatBDT } from "@/lib/format";

export default async function HomePage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    categoriesRes,
    programsRes,
    mentorRowsRes,
    liveRes,
    ebooksRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("categories").select("*").order("sort_order"),
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
      .limit(6),
    supabase
      .from("live_classes")
      .select("*")
      .eq("is_public", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
    supabase.from("resources").select("*").eq("kind", "ebook").limit(4),
  ]);

  const categories = categoriesRes.data ?? [];
  const programs = programsRes.data ?? [];
  const mentorRows = mentorRowsRes.data ?? [];
  const liveClasses = liveRes.data ?? [];
  const ebooks = ebooksRes.data ?? [];

  // Resolve mentor display names/photos (public read of mentor profiles).
  const mentorIds = new Set<string>();
  mentorRows.forEach((m) => mentorIds.add(m.id));
  programs.forEach((p) => p.mentor_id && mentorIds.add(p.mentor_id));

  const profilesRes = mentorIds.size
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", [...mentorIds])
    : { data: [] };
  const profiles = profilesRes.data ?? [];
  const profileById = new Map(profiles.map((p) => [p.id, p]));

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

  const askHref = user ? "/dashboard/questions/new" : "/login?next=/dashboard/questions/new";

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* 1. Hero */}
      <section className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-card">
            <Sparkles className="size-4 text-primary" />
            Mentorship-first learning for Bangladesh
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find the Right Mentor.
            <br />
            <span className="text-primary">Build a Meaningful Career.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Learn directly from experienced mentors through structured
            mentorship programs, premium courses, live sessions, e-books, and
            practical career guidance.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/mentors">
                Find Your Mentor
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/programs">Explore Programs</Link>
            </Button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative hidden lg:block">
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-brand-hover/20 shadow-card" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-border bg-card/90 p-4 shadow-card backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Star className="size-5 fill-warning text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Guided by expert mentors
                </p>
                <p className="text-xs text-muted-foreground">
                  Personal guidance, not just courses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Meet our mentors */}
      {mentors.length > 0 ? (
        <section className="py-14">
          <Reveal>
            <SectionHeading
              eyebrow="The heart of MCA"
              title="Meet our mentors"
              description="Experienced professionals ready to guide you personally."
              href="/mentors"
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor, i) => (
              <Reveal key={mentor.id} delay={i * 0.05}>
                <MentorCard mentor={mentor} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* 3. Learning programs (categories) */}
      <section className="py-14">
        <Reveal>
          <SectionHeading
            eyebrow="Explore"
            title="Learning programs for every goal"
            description="From admission prep to programming and career skills."
            href="/programs"
          />
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, i) => (
            <Reveal key={category.id} delay={i * 0.03}>
              <Link
                href={`/programs?category=${category.slug}`}
                className="flex h-full flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>
                <span className="font-medium text-foreground">
                  {category.name}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. Why MCA */}
      <section className="py-14">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Why learn with MCA"
            title="More than courses — real guidance"
          />
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_MCA.map((pillar, i) => {
            const Icon = getIcon(pillar.icon);
            return (
              <Reveal key={pillar.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 5. Featured programs */}
      {programs.length > 0 ? (
        <section className="py-14">
          <Reveal>
            <SectionHeading
              eyebrow="Featured"
              title="Popular programs right now"
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

      {/* 6. Success stories */}
      <section className="py-14">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Student stories"
            title="Careers built with guidance"
          />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.05}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-4 fill-warning" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <span className="block text-muted-foreground">{t.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7. Ask a mentor CTA */}
      <section className="py-14">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-brand-hover/10 p-8 text-center shadow-card sm:p-12">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircleQuestion className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Stuck on something? Ask a mentor.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Get personal, thoughtful answers to your learning and career
              questions — usually within 24–48 hours.
            </p>
            <Button asChild size="lg" className="mt-6 rounded-full">
              <Link href={askHref}>
                Ask a Question
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* 8. Live classes */}
      {liveClasses.length > 0 ? (
        <section className="py-14">
          <Reveal>
            <SectionHeading
              eyebrow="Live"
              title="Upcoming live classes"
              href="/live-classes"
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {liveClasses.map((lc, i) => (
              <Reveal key={lc.id} delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="inline-flex items-center gap-2 text-sm text-primary">
                    <CalendarDays className="size-4" />
                    {new Date(lc.starts_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">
                    {lc.title}
                  </h3>
                  {lc.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {lc.description}
                    </p>
                  ) : null}
                  <Button
                    asChild
                    variant="outline"
                    className="mt-auto w-fit rounded-full"
                    size="sm"
                  >
                    <Link href="/live-classes">View details</Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* 9. Premium e-books */}
      {ebooks.length > 0 ? (
        <section className="py-14">
          <Reveal>
            <SectionHeading
              eyebrow="Read"
              title="Premium e-books & resources"
              href="/resources"
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ebooks.map((book, i) => (
              <Reveal key={book.id} delay={i * 0.05}>
                <Link
                  href={`/resources/${book.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-brand-hover/15">
                    <span className="px-4 text-center text-sm font-medium text-primary/50">
                      {book.title}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {book.title}
                    </h3>
                    <span className="mt-auto pt-3 font-semibold text-foreground">
                      {formatBDT(book.price_bdt)}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* 10. Community CTA */}
      <section className="py-14">
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Join our learning community
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Connect with fellow learners, share progress, and stay
                  motivated together.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full">
                  <a href={COMMUNITY.facebook} target="_blank" rel="noopener noreferrer">
                    Facebook Group
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <a href={COMMUNITY.whatsapp} target="_blank" rel="noopener noreferrer">
                    WhatsApp Group
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
