"use server";

/**
 * LMS program-editor server actions (Chunk 3).
 *
 * Granular mutations backing the 3-column autosaving admin course editor:
 * program info, multi-mentor assignment, Seasons (modules), Classes (lessons),
 * per-class resources, quiz (Q&A), and notes.
 *
 * Design notes:
 *  - Every action re-verifies admin (defense in depth; render-time gating is not
 *    a security boundary — see Next.js "Server Actions and Mutations").
 *  - High-frequency text autosaves (program info, season/class fields, overview,
 *    notes) intentionally DO NOT call revalidatePath: the client editor is the
 *    authoritative source of truth while editing, and revalidating would re-run
 *    the whole route on every debounced keystroke. Structural changes (create /
 *    delete / reorder / duplicate / mentor assignment / status) revalidate the
 *    admin list + public program pages so downstream views stay fresh.
 *  - Actions return the persisted data the client needs (e.g. new row ids) so the
 *    UI can update optimistically without a full refetch.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRichText } from "@/lib/sanitize-html";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type DB = SupabaseClient<Database>;
type Result<T = undefined> = { error?: string; data?: T };

async function assertAdmin(): Promise<DB | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin" ? supabase : null;
}

function touchPublic() {
  // Public program pages + the admin list reflect structural / status changes.
  revalidatePath("/admin/programs");
  revalidatePath("/programs");
  revalidatePath("/programs/[slug]", "page");
}

// ============================================================
// Program information (autosave — no revalidate)
// ============================================================

const programInfoSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  preview_video_url: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
  status: z.enum(["draft", "published", "hidden"]).optional(),
  price_bdt: z.number().min(0).optional(),
  discount_bdt: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
  cover_url: z.string().nullable().optional(),
});

export async function updateProgramInfo(
  programId: string,
  patch: z.input<typeof programInfoSchema>,
  options?: { revalidate?: boolean },
): Promise<Result> {
  const parsed = programInfoSchema.safeParse(patch);
  if (!parsed.success) return { error: "Please check the program fields." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const row = { ...parsed.data, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("programs").update(row).eq("id", programId);
  if (error) {
    console.error("updateProgramInfo failed", error);
    return { error: "Could not save the program." };
  }
  // Status / featured / cover changes should reach the public site immediately.
  if (options?.revalidate) touchPublic();
  return {};
}

// ============================================================
// Mentor assignment (program_mentors)
// ============================================================

export async function assignMentor(
  programId: string,
  mentorId: string,
): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { count } = await supabase
    .from("program_mentors")
    .select("mentor_id", { count: "exact", head: true })
    .eq("program_id", programId);

  const { error } = await supabase.from("program_mentors").insert({
    program_id: programId,
    mentor_id: mentorId,
    is_primary: (count ?? 0) === 0, // first mentor becomes primary
    sort_order: count ?? 0,
  });
  if (error) {
    if (error.code === "23505") return { error: "That mentor is already assigned." };
    console.error("assignMentor failed", error);
    return { error: "Could not assign the mentor." };
  }
  touchPublic();
  return {};
}

export async function removeMentor(
  programId: string,
  mentorId: string,
): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { data: removed } = await supabase
    .from("program_mentors")
    .select("is_primary")
    .eq("program_id", programId)
    .eq("mentor_id", mentorId)
    .maybeSingle();

  const { error } = await supabase
    .from("program_mentors")
    .delete()
    .eq("program_id", programId)
    .eq("mentor_id", mentorId);
  if (error) {
    console.error("removeMentor failed", error);
    return { error: "Could not remove the mentor." };
  }

  // If we removed the primary, promote the next assigned mentor.
  if (removed?.is_primary) {
    const { data: next } = await supabase
      .from("program_mentors")
      .select("mentor_id")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("program_mentors")
        .update({ is_primary: true })
        .eq("program_id", programId)
        .eq("mentor_id", next.mentor_id);
    }
  }
  touchPublic();
  return {};
}

export async function setPrimaryMentor(
  programId: string,
  mentorId: string,
): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { error: clearErr } = await supabase
    .from("program_mentors")
    .update({ is_primary: false })
    .eq("program_id", programId);
  if (clearErr) {
    console.error("setPrimaryMentor clear failed", clearErr);
    return { error: "Could not update the primary mentor." };
  }
  const { error } = await supabase
    .from("program_mentors")
    .update({ is_primary: true })
    .eq("program_id", programId)
    .eq("mentor_id", mentorId);
  if (error) {
    console.error("setPrimaryMentor set failed", error);
    return { error: "Could not update the primary mentor." };
  }
  touchPublic();
  return {};
}

// ============================================================
// Seasons (modules)
// ============================================================

export async function createSeason(
  programId: string,
  title?: string,
): Promise<Result<{ id: string; title: string; subtitle: string | null; sort_order: number }>> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  const sort_order = count ?? 0;
  const name = title?.trim() || `Season ${sort_order + 1}`;

  const { data, error } = await supabase
    .from("modules")
    .insert({ program_id: programId, title: name, sort_order })
    .select("id, title, subtitle, sort_order")
    .single();
  if (error || !data) {
    console.error("createSeason failed", error);
    return { error: "Could not add the season." };
  }
  touchPublic();
  return {
    data: {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      sort_order: data.sort_order ?? sort_order,
    },
  };
}

const seasonPatchSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
});

export async function updateSeason(
  seasonId: string,
  patch: z.input<typeof seasonPatchSchema>,
): Promise<Result> {
  const parsed = seasonPatchSchema.safeParse(patch);
  if (!parsed.success) return { error: "Enter a season title." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("modules").update(parsed.data).eq("id", seasonId);
  if (error) {
    console.error("updateSeason failed", error);
    return { error: "Could not save the season." };
  }
  return {};
}

export async function deleteSeason(seasonId: string): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("modules").delete().eq("id", seasonId);
  if (error) {
    console.error("deleteSeason failed", error);
    return { error: "Could not delete the season." };
  }
  touchPublic();
  return {};
}

export async function reorderSeasons(
  programId: string,
  orderedIds: string[],
): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("modules")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("program_id", programId);
    if (error) {
      console.error("reorderSeasons failed", error);
      return { error: "Could not reorder seasons." };
    }
  }
  touchPublic();
  return {};
}

// ============================================================
// Classes (lessons)
// ============================================================

type ClassRow = {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  overview_html: string | null;
  thumbnail_url: string | null;
  admin_notes: string | null;
  status: string;
  is_preview: boolean;
  duration_seconds: number | null;
  sort_order: number;
};

export async function createClass(
  seasonId: string,
  title?: string,
): Promise<Result<ClassRow>> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", seasonId);
  const sort_order = count ?? 0;
  const name = title?.trim() || `Class ${sort_order + 1}`;

  const { data, error } = await supabase
    .from("lessons")
    .insert({ module_id: seasonId, title: name, sort_order, status: "draft" })
    .select(
      "id, module_id, title, video_url, overview_html, thumbnail_url, admin_notes, status, is_preview, duration_seconds, sort_order",
    )
    .single();
  if (error || !data) {
    console.error("createClass failed", error);
    return { error: "Could not add the class." };
  }
  touchPublic();
  return { data: normalizeClass(data) };
}

const classPatchSchema = z.object({
  title: z.string().min(1).optional(),
  video_url: z.string().nullable().optional(),
  // Shape only — the value itself is run through `sanitizeRichText` in
  // updateClass below, because it is later rendered with
  // dangerouslySetInnerHTML in the course player.
  overview_html: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  admin_notes: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "hidden"]).optional(),
  is_preview: z.boolean().optional(),
  duration_seconds: z.number().int().min(0).nullable().optional(),
});

export async function updateClass(
  classId: string,
  patch: z.input<typeof classPatchSchema>,
): Promise<Result> {
  const parsed = classPatchSchema.safeParse(patch);
  if (!parsed.success) return { error: "Please check the class fields." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  // The Overview editor is a contentEditable surface whose raw innerHTML is
  // posted here, and the course player renders it with dangerouslySetInnerHTML
  // — so this is the choke point where arbitrary markup becomes a stored XSS
  // payload. Sanitize before it ever reaches the database. `undefined` means
  // "this patch doesn't touch the field"; `null` means "clear it"; only an
  // actual string needs cleaning.
  const row = { ...parsed.data };
  if (typeof row.overview_html === "string") {
    row.overview_html = sanitizeRichText(row.overview_html);
  }

  const { error } = await supabase.from("lessons").update(row).eq("id", classId);
  if (error) {
    console.error("updateClass failed", error);
    return { error: "Could not save the class." };
  }
  return {};
}

export async function deleteClass(classId: string): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("lessons").delete().eq("id", classId);
  if (error) {
    console.error("deleteClass failed", error);
    return { error: "Could not delete the class." };
  }
  touchPublic();
  return {};
}

export async function reorderClasses(
  seasonId: string,
  orderedIds: string[],
): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("lessons")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("module_id", seasonId);
    if (error) {
      console.error("reorderClasses failed", error);
      return { error: "Could not reorder classes." };
    }
  }
  touchPublic();
  return {};
}

/** Deep-copy a class (its resources + quiz + questions) into the same season. */
export async function duplicateClass(classId: string): Promise<Result<ClassRow>> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { data: src } = await supabase
    .from("lessons")
    .select(
      "module_id, title, video_url, content_md, overview_html, thumbnail_url, admin_notes, status, is_preview, duration_seconds",
    )
    .eq("id", classId)
    .maybeSingle();
  if (!src || !src.module_id) return { error: "Class not found." };
  const moduleId = src.module_id;

  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);

  const { data: copy, error } = await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,
      title: `${src.title} (Copy)`,
      video_url: src.video_url,
      content_md: src.content_md,
      // Re-sanitize on copy rather than trusting the source row: rows written
      // before sanitization landed can still hold a payload, and duplicating a
      // class must not launder it into a fresh one.
      overview_html: src.overview_html ? sanitizeRichText(src.overview_html) : null,
      thumbnail_url: src.thumbnail_url,
      admin_notes: src.admin_notes,
      status: "draft",
      is_preview: src.is_preview,
      duration_seconds: src.duration_seconds,
      sort_order: count ?? 0,
    })
    .select(
      "id, module_id, title, video_url, overview_html, thumbnail_url, admin_notes, status, is_preview, duration_seconds, sort_order",
    )
    .single();
  if (error || !copy) {
    console.error("duplicateClass failed", error);
    return { error: "Could not duplicate the class." };
  }

  // Copy resources.
  const { data: resources } = await supabase
    .from("lesson_resources")
    .select("title, type, file_url, external_url, sort_order")
    .eq("lesson_id", classId);
  if (resources?.length) {
    await supabase
      .from("lesson_resources")
      .insert(resources.map((r) => ({ ...r, lesson_id: copy.id })));
  }

  // Copy quiz + questions.
  const { data: srcQuiz } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("lesson_id", classId)
    .maybeSingle();
  if (srcQuiz) {
    const { data: newQuiz } = await supabase
      .from("quizzes")
      .insert({ lesson_id: copy.id, title: srcQuiz.title })
      .select("id")
      .single();
    if (newQuiz) {
      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("type, question, options, correct_answer, explanation, sort_order")
        .eq("quiz_id", srcQuiz.id);
      if (qs?.length) {
        await supabase
          .from("quiz_questions")
          .insert(qs.map((q) => ({ ...q, quiz_id: newQuiz.id })));
      }
    }
  }

  touchPublic();
  return { data: normalizeClass(copy) };
}

function normalizeClass(d: {
  id: string;
  module_id: string | null;
  title: string;
  video_url: string | null;
  overview_html: string | null;
  thumbnail_url: string | null;
  admin_notes: string | null;
  status: string;
  is_preview: boolean | null;
  duration_seconds: number | null;
  sort_order: number | null;
}): ClassRow {
  return {
    id: d.id,
    module_id: d.module_id ?? "",
    title: d.title,
    video_url: d.video_url,
    overview_html: d.overview_html,
    thumbnail_url: d.thumbnail_url,
    admin_notes: d.admin_notes,
    status: d.status,
    is_preview: d.is_preview ?? false,
    duration_seconds: d.duration_seconds,
    sort_order: d.sort_order ?? 0,
  };
}

// ============================================================
// Lesson resources
// ============================================================

type ResourceRow = {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  external_url: string | null;
  sort_order: number;
};

const resourceSchema = z.object({
  title: z.string().min(1, "Enter a resource title."),
  type: z.enum(["pdf", "docx", "ppt", "zip", "link", "drive", "other"]),
  file_url: z.string().nullable().optional(),
  external_url: z.string().nullable().optional(),
});

export async function createResource(
  lessonId: string,
  input: z.input<typeof resourceSchema>,
): Promise<Result<ResourceRow>> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid resource." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { count } = await supabase
    .from("lesson_resources")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", lessonId);

  const { data, error } = await supabase
    .from("lesson_resources")
    .insert({
      lesson_id: lessonId,
      title: parsed.data.title,
      type: parsed.data.type,
      file_url: parsed.data.file_url ?? null,
      external_url: parsed.data.external_url ?? null,
      sort_order: count ?? 0,
    })
    .select("id, title, type, file_url, external_url, sort_order")
    .single();
  if (error || !data) {
    console.error("createResource failed", error);
    return { error: "Could not add the resource." };
  }
  return {
    data: {
      id: data.id,
      title: data.title,
      type: data.type,
      file_url: data.file_url,
      external_url: data.external_url,
      sort_order: data.sort_order ?? 0,
    },
  };
}

export async function updateResource(
  resourceId: string,
  input: z.input<typeof resourceSchema>,
): Promise<Result> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid resource." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase
    .from("lesson_resources")
    .update({
      title: parsed.data.title,
      type: parsed.data.type,
      file_url: parsed.data.file_url ?? null,
      external_url: parsed.data.external_url ?? null,
    })
    .eq("id", resourceId);
  if (error) {
    console.error("updateResource failed", error);
    return { error: "Could not save the resource." };
  }
  return {};
}

export async function deleteResource(resourceId: string): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("lesson_resources").delete().eq("id", resourceId);
  if (error) {
    console.error("deleteResource failed", error);
    return { error: "Could not delete the resource." };
  }
  return {};
}

// ============================================================
// Quiz (Q&A)
// ============================================================

type QuestionRow = {
  id: string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string | null;
  explanation: string | null;
  sort_order: number;
};

/** Return the class's quiz id, creating the quiz row on first use. */
async function ensureQuiz(supabase: DB, lessonId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("quizzes")
    .insert({ lesson_id: lessonId })
    .select("id")
    .single();
  if (error || !created) {
    console.error("ensureQuiz failed", error);
    return null;
  }
  return created.id;
}

const questionSchema = z.object({
  type: z.enum(["mcq", "true_false", "short"]),
  question: z.string().min(1, "Enter the question."),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
});

export async function createQuestion(
  lessonId: string,
  input: z.input<typeof questionSchema>,
): Promise<Result<QuestionRow>> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid question." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const quizId = await ensureQuiz(supabase, lessonId);
  if (!quizId) return { error: "Could not create the quiz." };

  const { count } = await supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  const options = normalizeOptions(parsed.data.type, parsed.data.options);
  const { data, error } = await supabase
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      type: parsed.data.type,
      question: parsed.data.question,
      options,
      correct_answer: parsed.data.correct_answer ?? null,
      explanation: parsed.data.explanation ?? null,
      sort_order: count ?? 0,
    })
    .select("id, type, question, options, correct_answer, explanation, sort_order")
    .single();
  if (error || !data) {
    console.error("createQuestion failed", error);
    return { error: "Could not add the question." };
  }
  return { data: normalizeQuestion(data) };
}

export async function updateQuestion(
  questionId: string,
  input: z.input<typeof questionSchema>,
): Promise<Result> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid question." };
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const options = normalizeOptions(parsed.data.type, parsed.data.options);
  const { error } = await supabase
    .from("quiz_questions")
    .update({
      type: parsed.data.type,
      question: parsed.data.question,
      options,
      correct_answer: parsed.data.correct_answer ?? null,
      explanation: parsed.data.explanation ?? null,
    })
    .eq("id", questionId);
  if (error) {
    console.error("updateQuestion failed", error);
    return { error: "Could not save the question." };
  }
  return {};
}

export async function deleteQuestion(questionId: string): Promise<Result> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
  if (error) {
    console.error("deleteQuestion failed", error);
    return { error: "Could not delete the question." };
  }
  return {};
}

function normalizeOptions(type: string, options?: string[]): string[] {
  if (type === "true_false") return ["True", "False"];
  if (type === "short") return [];
  return (options ?? []).map((o) => o.trim()).filter(Boolean);
}

function normalizeQuestion(d: {
  id: string;
  type: string;
  question: string;
  options: unknown;
  correct_answer: string | null;
  explanation: string | null;
  sort_order: number | null;
}): QuestionRow {
  return {
    id: d.id,
    type: d.type,
    question: d.question,
    options: Array.isArray(d.options) ? (d.options as string[]) : [],
    correct_answer: d.correct_answer,
    explanation: d.explanation,
    sort_order: d.sort_order ?? 0,
  };
}
