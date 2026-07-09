import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, CirclePlay, Lock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/shared/markdown";
import { MarkCompleteButton } from "@/components/dashboard/mark-complete-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Learn" };

/** Normalise a YouTube URL to an embeddable form. */
function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([^?]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ programSlug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { programSlug } = await params;
  const { lesson: lessonParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/learn/${programSlug}`);

  const { data: program } = await supabase
    .from("programs")
    .select("id, slug, title")
    .eq("slug", programSlug)
    .maybeSingle();
  if (!program) notFound();

  // Enrollment gate (admins may preview).
  const [{ data: enrollment }, { data: profile }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  const isAdmin = profile?.role === "admin";
  if (!enrollment && !isAdmin) redirect(`/programs/${programSlug}`);

  // Curriculum + progress.
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort_order")
    .eq("program_id", program.id)
    .order("sort_order", { ascending: true });
  const moduleIds = (modules ?? []).map((m) => m.id);

  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id, module_id, title, video_url, content_md, sort_order")
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true })
    : { data: [] };
  const allLessons = lessons ?? [];

  const lessonIds = allLessons.map((l) => l.id);
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: [] };
  const completedSet = new Set(
    (progress ?? []).filter((p) => p.is_completed).map((p) => p.lesson_id),
  );

  const current =
    allLessons.find((l) => l.id === lessonParam) ?? allLessons[0] ?? null;
  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="font-semibold text-foreground">No lessons yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This program&apos;s content is being prepared.
        </p>
      </div>
    );
  }

  const embed = toEmbedUrl(current.video_url);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/dashboard/programs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {program.title}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Player + content */}
        <div className="min-w-0 space-y-5">
          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            {embed ? (
              <iframe
                src={embed}
                title={current.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                No video for this lesson.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {current.title}
            </h1>
            <MarkCompleteButton
              lessonId={current.id}
              programId={program.id}
              completed={completedSet.has(current.id)}
            />
          </div>

          {current.content_md ? <Markdown content={current.content_md} /> : null}
        </div>

        {/* Curriculum */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold text-foreground">Curriculum</h2>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {(modules ?? []).map((mod) => {
                const modLessons = allLessons.filter(
                  (l) => l.module_id === mod.id,
                );
                return (
                  <div key={mod.id} className="border-b border-border last:border-0">
                    <p className="bg-secondary/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {mod.title}
                    </p>
                    <ul>
                      {modLessons.map((l) => {
                        const done = completedSet.has(l.id);
                        const active = l.id === current.id;
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/dashboard/learn/${programSlug}?lesson=${l.id}`}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                                active
                                  ? "bg-primary/10 font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-secondary/50",
                              )}
                            >
                              {done ? (
                                <Check className="size-4 shrink-0 text-success" />
                              ) : active ? (
                                <CirclePlay className="size-4 shrink-0 text-primary" />
                              ) : (
                                <Lock className="size-4 shrink-0 opacity-40" />
                              )}
                              <span className="line-clamp-1">{l.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
