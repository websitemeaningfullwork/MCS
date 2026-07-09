import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Check,
  CirclePlay,
  Clock,
  Lock,
  Star,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatBDT, effectivePriceBDT, hasDiscount, levelLabel } from "@/lib/format";

async function getProgram(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) return { title: "Program not found" };
  return {
    title: program.title,
    description: program.subtitle ?? program.description ?? undefined,
  };
}

const FAQS = [
  {
    q: "How does the mentorship work?",
    a: "Once enrolled, you get access to the program content and can ask your mentor questions through the Ask-a-Mentor feature. Mentors usually reply within 24–48 hours.",
  },
  {
    q: "How do I pay?",
    a: "We use a simple, admin-verified bKash flow. At checkout you'll see the bKash number, send the amount, and submit your transaction details. We verify and unlock access within 24 hours.",
  },
  {
    q: "Do I get lifetime access?",
    a: "Yes — once your enrollment is approved, you keep access to the program content and can revisit lessons anytime.",
  },
];

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const program = await getProgram(slug);
  if (!program) notFound();

  // Mentor + curriculum in parallel.
  const [mentorRes, profileRes, modulesRes] = await Promise.all([
    program.mentor_id
      ? supabase
          .from("mentors")
          .select("id, headline, expertise, rating, reviews_count, is_verified, years_experience")
          .eq("id", program.mentor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    program.mentor_id
      ? supabase
          .from("public_mentor_profiles")
          .select("id, full_name, avatar_url, bio")
          .eq("id", program.mentor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("modules")
      .select("id, title, sort_order")
      .eq("program_id", program.id)
      .order("sort_order", { ascending: true }),
  ]);

  const mentor = mentorRes.data;
  const mentorProfile = profileRes.data;
  const modules = modulesRes.data ?? [];

  const moduleIds = modules.map((m) => m.id);
  const { data: lessonsData } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id, module_id, title, is_preview, sort_order")
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true })
    : { data: [] };
  const lessons = lessonsData ?? [];
  const totalLessons = lessons.length;

  const price = effectivePriceBDT(program.price_bdt, program.discount_bdt);
  const showDiscount = hasDiscount(program.price_bdt, program.discount_bdt);
  const durationHours = program.duration_minutes
    ? Math.max(1, Math.round(program.duration_minutes / 60))
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{levelLabel(program.level)}</Badge>
            {program.is_bestseller ? (
              <Badge className="bg-warning text-primary-foreground">
                Bestseller
              </Badge>
            ) : null}
            {program.rating && program.rating > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">
                  {program.rating.toFixed(1)}
                </span>
                {program.reviews_count ? <span>({program.reviews_count})</span> : null}
              </span>
            ) : null}
            {program.enrolled_count ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-4" />
                {program.enrolled_count} enrolled
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {program.title}
          </h1>
          {program.subtitle ? (
            <p className="mt-3 text-lg text-muted-foreground">
              {program.subtitle}
            </p>
          ) : null}
          {mentorProfile?.full_name ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Mentored by{" "}
              <Link
                href={`/mentors/${program.mentor_id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {mentorProfile.full_name}
              </Link>
            </p>
          ) : null}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-8">
              {program.description ? (
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
              ) : null}

              {program.learning_outcomes && program.learning_outcomes.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    What you&apos;ll learn
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {program.learning_outcomes.map((outcome) => (
                      <li key={outcome} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        <span className="text-muted-foreground">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {program.requirements && program.requirements.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Requirements
                  </h2>
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {program.requirements.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="curriculum" className="mt-6">
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Curriculum coming soon.
                </p>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod) => {
                    const modLessons = lessons.filter((l) => l.module_id === mod.id);
                    return (
                      <div
                        key={mod.id}
                        className="overflow-hidden rounded-2xl border border-border"
                      >
                        <div className="flex items-center justify-between bg-secondary/50 px-4 py-3">
                          <h3 className="font-medium text-foreground">
                            {mod.title}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {modLessons.length} lessons
                          </span>
                        </div>
                        <ul className="divide-y divide-border">
                          {modLessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex items-center justify-between px-4 py-3 text-sm"
                            >
                              <span className="flex items-center gap-2 text-muted-foreground">
                                {lesson.is_preview ? (
                                  <CirclePlay className="size-4 text-primary" />
                                ) : (
                                  <Lock className="size-4" />
                                )}
                                {lesson.title}
                              </span>
                              {lesson.is_preview ? (
                                <Badge variant="secondary">Preview</Badge>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mentor" className="mt-6">
              {mentor && mentorProfile ? (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {mentorProfile.full_name}
                    </h3>
                    {mentor.is_verified ? (
                      <BadgeCheck className="size-4 text-primary" />
                    ) : null}
                  </div>
                  {mentor.headline ? (
                    <p className="text-sm text-primary">{mentor.headline}</p>
                  ) : null}
                  {mentorProfile.bio ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {mentorProfile.bio}
                    </p>
                  ) : null}
                  <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                    <Link href={`/mentors/${program.mentor_id}`}>
                      View mentor profile
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  A mentor will be assigned to this program soon.
                </p>
              )}
            </TabsContent>

            <TabsContent value="faq" className="mt-6 space-y-4">
              {FAQS.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <h3 className="font-medium text-foreground">{item.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky price card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-secondary to-brand-hover/15">
              <CirclePlay className="size-10 text-primary/50" />
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-foreground">
                {formatBDT(price)}
              </span>
              {showDiscount ? (
                <span className="text-lg text-muted-foreground line-through">
                  {formatBDT(program.price_bdt)}
                </span>
              ) : null}
            </div>

            <Button asChild size="lg" className="mt-5 w-full rounded-full">
              <Link href={`/checkout?type=program&id=${program.id}`}>
                {price > 0 ? "Enrol now" : "Enrol for free"}
              </Link>
            </Button>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Star className="size-4 text-primary" />
                {levelLabel(program.level)}
              </li>
              {durationHours ? (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4 text-primary" />
                  {durationHours} hours of content
                </li>
              ) : null}
              <li className="flex items-center gap-2 text-muted-foreground">
                <CirclePlay className="size-4 text-primary" />
                {totalLessons} lessons
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <BadgeCheck className="size-4 text-primary" />
                Mentor guidance included
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
