import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-guard";
import { ProgramEditor } from "@/components/admin/program-editor/program-editor";
import type {
  AssignedMentor,
  CategoryOption,
  ClassItem,
  MentorOption,
  ProgramInfo,
  Question,
  Resource,
  Season,
} from "@/components/admin/program-editor/types";

export const metadata: Metadata = { title: "Edit program" };

type Level = ProgramInfo["level"];
type ProgramStatus = ProgramInfo["status"];

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!program) notFound();

  // --- reference data -------------------------------------------------------
  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });
  const categories: CategoryOption[] = (categoryRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const { data: mentorRows } = await supabase.from("mentors").select("id, headline");
  const mentorIds = (mentorRows ?? []).map((m) => m.id);
  const { data: mentorProfiles } = mentorIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", mentorIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
  const mentorOptions: MentorOption[] = (mentorRows ?? []).map((m) => {
    const p = (mentorProfiles ?? []).find((x) => x.id === m.id);
    return {
      id: m.id,
      name: p?.full_name ?? "Mentor",
      headline: m.headline ?? null,
      avatar_url: p?.avatar_url ?? null,
    };
  });

  const { data: pmRows } = await supabase
    .from("program_mentors")
    .select("mentor_id, is_primary, sort_order")
    .eq("program_id", id)
    .order("sort_order", { ascending: true });
  const assignedMentors: AssignedMentor[] = (pmRows ?? []).map((r) => ({
    mentor_id: r.mentor_id,
    is_primary: r.is_primary,
    sort_order: r.sort_order,
  }));

  // --- curriculum tree ------------------------------------------------------
  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, title, subtitle, sort_order")
    .eq("program_id", id)
    .order("sort_order", { ascending: true });

  const moduleIds = (moduleRows ?? []).map((m) => m.id);
  const { data: lessonRows } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select(
          "id, module_id, title, video_url, overview_html, thumbnail_url, admin_notes, status, is_preview, duration_seconds, sort_order",
        )
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  const lessonIds = (lessonRows ?? []).map((l) => l.id as string);

  const { data: resourceRows } = lessonIds.length
    ? await supabase
        .from("lesson_resources")
        .select("id, lesson_id, title, type, file_url, external_url, sort_order")
        .in("lesson_id", lessonIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  const { data: quizRows } = lessonIds.length
    ? await supabase.from("quizzes").select("id, lesson_id").in("lesson_id", lessonIds)
    : { data: [] as Array<{ id: string; lesson_id: string }> };
  const quizByLesson = new Map<string, string>();
  const lessonByQuiz = new Map<string, string>();
  for (const q of quizRows ?? []) {
    quizByLesson.set(q.lesson_id, q.id);
    lessonByQuiz.set(q.id, q.lesson_id);
  }
  const quizIds = [...lessonByQuiz.keys()];

  const { data: questionRows } = quizIds.length
    ? await supabase
        .from("quiz_questions")
        .select("id, quiz_id, type, question, options, correct_answer, explanation, sort_order")
        .in("quiz_id", quizIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  const resourcesByLesson = new Map<string, Resource[]>();
  for (const r of resourceRows ?? []) {
    const list = resourcesByLesson.get(r.lesson_id as string) ?? [];
    list.push({
      id: r.id as string,
      title: r.title as string,
      type: r.type as Resource["type"],
      file_url: (r.file_url as string) ?? null,
      external_url: (r.external_url as string) ?? null,
      sort_order: (r.sort_order as number) ?? 0,
    });
    resourcesByLesson.set(r.lesson_id as string, list);
  }

  const questionsByLesson = new Map<string, Question[]>();
  for (const q of questionRows ?? []) {
    const lessonId = lessonByQuiz.get(q.quiz_id as string);
    if (!lessonId) continue;
    const list = questionsByLesson.get(lessonId) ?? [];
    list.push({
      id: q.id as string,
      type: q.type as Question["type"],
      question: q.question as string,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      correct_answer: (q.correct_answer as string) ?? null,
      explanation: (q.explanation as string) ?? null,
      sort_order: (q.sort_order as number) ?? 0,
    });
    questionsByLesson.set(lessonId, list);
  }

  const seasons: Season[] = (moduleRows ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    subtitle: m.subtitle ?? null,
    sort_order: m.sort_order ?? 0,
    classes: (lessonRows ?? [])
      .filter((l) => (l.module_id as string) === m.id)
      .map((l): ClassItem => ({
        id: l.id as string,
        module_id: (l.module_id as string) ?? m.id,
        title: l.title as string,
        video_url: (l.video_url as string) ?? null,
        overview_html: (l.overview_html as string) ?? null,
        thumbnail_url: (l.thumbnail_url as string) ?? null,
        admin_notes: (l.admin_notes as string) ?? null,
        status: ((l.status as string) ?? "published") as ClassItem["status"],
        is_preview: (l.is_preview as boolean) ?? false,
        duration_seconds: (l.duration_seconds as number) ?? null,
        sort_order: (l.sort_order as number) ?? 0,
        resources: resourcesByLesson.get(l.id as string) ?? [],
        questions: questionsByLesson.get(l.id as string) ?? [],
      })),
  }));

  const info: ProgramInfo = {
    id: program.id,
    title: program.title,
    slug: program.slug,
    subtitle: program.subtitle ?? "",
    description: program.description ?? "",
    cover_url: program.cover_url ?? null,
    preview_video_url: program.preview_video_url ?? "",
    category_id: program.category_id ?? null,
    level: (program.level ?? "all_levels") as Level,
    // Legacy rows may carry the old 'archived' status; surface it as 'hidden'
    // (the editor exposes Draft / Published / Hidden).
    status: (program.status === "archived"
      ? "hidden"
      : (program.status ?? "draft")) as ProgramStatus,
    price_bdt: Number(program.price_bdt ?? 0),
    discount_bdt: Number(program.discount_bdt ?? 0),
    is_featured: program.is_featured ?? false,
  };

  return (
    <ProgramEditor
      initialInfo={info}
      initialSeasons={seasons}
      initialMentors={assignedMentors}
      categories={categories}
      mentorOptions={mentorOptions}
    />
  );
}
