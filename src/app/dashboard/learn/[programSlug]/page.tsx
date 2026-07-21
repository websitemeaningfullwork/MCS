import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CoursePlayer } from "@/components/dashboard/course-player/course-player";
import type {
  PlayerQuestion,
  PlayerResource,
  PlayerSeason,
} from "@/components/dashboard/course-player/types";

export const metadata: Metadata = { title: "Learn" };

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

  // --- curriculum ----------------------------------------------------------
  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, title, subtitle, sort_order")
    .eq("program_id", program.id)
    .order("sort_order", { ascending: true });
  const moduleIds = (moduleRows ?? []).map((m) => m.id);

  let lessonQuery = supabase
    .from("lessons")
    .select(
      "id, module_id, title, video_url, overview_html, content_md, admin_notes, status, is_preview, duration_seconds, sort_order",
    )
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"])
    .order("sort_order", { ascending: true });
  // Students only see published classes; admins previewing see everything.
  if (!isAdmin) lessonQuery = lessonQuery.eq("status", "published");
  const { data: lessonRows } = await lessonQuery;
  const lessons = lessonRows ?? [];
  const lessonIds = lessons.map((l) => l.id);

  // Resources
  const { data: resourceRows } = lessonIds.length
    ? await supabase
        .from("lesson_resources")
        .select("id, lesson_id, title, type, file_url, external_url, sort_order")
        .in("lesson_id", lessonIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  // Quiz questions (via quizzes)
  const { data: quizRows } = lessonIds.length
    ? await supabase.from("quizzes").select("id, lesson_id").in("lesson_id", lessonIds)
    : { data: [] as Array<{ id: string; lesson_id: string }> };
  const lessonByQuiz = new Map<string, string>();
  for (const q of quizRows ?? []) lessonByQuiz.set(q.id, q.lesson_id);
  const quizIds = [...lessonByQuiz.keys()];

  const { data: questionRows } = quizIds.length
    ? await supabase
        .from("quiz_questions")
        .select("id, quiz_id, type, question, options, correct_answer, explanation, sort_order")
        .in("quiz_id", quizIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  // Progress
  const { data: progressRows } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: [] as Array<{ lesson_id: string; is_completed: boolean | null }> };
  const completed = (progressRows ?? [])
    .filter((p) => p.is_completed)
    .map((p) => p.lesson_id);

  // --- assemble ------------------------------------------------------------
  const resourcesByLesson = new Map<string, PlayerResource[]>();
  for (const r of resourceRows ?? []) {
    const list = resourcesByLesson.get(r.lesson_id as string) ?? [];
    list.push({
      id: r.id as string,
      title: r.title as string,
      type: r.type as PlayerResource["type"],
      file_url: (r.file_url as string) ?? null,
      external_url: (r.external_url as string) ?? null,
    });
    resourcesByLesson.set(r.lesson_id as string, list);
  }

  const questionsByLesson = new Map<string, PlayerQuestion[]>();
  for (const q of questionRows ?? []) {
    const lessonId = lessonByQuiz.get(q.quiz_id as string);
    if (!lessonId) continue;
    const list = questionsByLesson.get(lessonId) ?? [];
    list.push({
      id: q.id as string,
      type: q.type as PlayerQuestion["type"],
      question: q.question as string,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      correct_answer: (q.correct_answer as string) ?? null,
      explanation: (q.explanation as string) ?? null,
    });
    questionsByLesson.set(lessonId, list);
  }

  const seasons: PlayerSeason[] = (moduleRows ?? [])
    .map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: m.subtitle ?? null,
      lessons: lessons
        .filter((l) => l.module_id === m.id)
        .map((l) => ({
          id: l.id,
          title: l.title,
          video_url: l.video_url ?? null,
          overview_html: l.overview_html ?? null,
          content_md: l.content_md ?? null,
          admin_notes: l.admin_notes ?? null,
          duration_seconds: l.duration_seconds ?? null,
          is_preview: l.is_preview ?? false,
          resources: resourcesByLesson.get(l.id) ?? [],
          questions: questionsByLesson.get(l.id) ?? [],
        })),
    }))
    .filter((s) => s.lessons.length > 0);

  return (
    <CoursePlayer
      program={{ id: program.id, title: program.title, slug: program.slug }}
      seasons={seasons}
      initialCompleted={completed}
      initialLessonId={lessonParam ?? null}
      askMentorHref={`/dashboard/questions/new?program=${program.id}`}
      isAdminPreview={!enrollment && isAdmin}
    />
  );
}
