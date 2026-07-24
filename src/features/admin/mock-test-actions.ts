"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

async function assertAdmin() {
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

const testSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Enter a title."),
  slug: z.string().min(3, "Enter a slug."),
  category_id: z.string().uuid().optional().or(z.literal("")),
  test_type: z.enum(["topic", "practice", "full"]),
  duration_minutes: z.number().min(0),
  is_free: z.boolean(),
});

export type MockTestInput = z.infer<typeof testSchema>;

export async function saveMockTest(input: MockTestInput): Promise<{ error?: string }> {
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const d = parsed.data;
  const row = {
    title: d.title,
    slug: d.slug,
    category_id: d.category_id ? d.category_id : null,
    test_type: d.test_type,
    duration_minutes: d.duration_minutes || null,
    is_free: d.is_free,
  };

  if (d.id) {
    const { error } = await supabase.from("mock_tests").update(row).eq("id", d.id);
    if (error) {
      // 23505 = slug unique violation; anything else is unexpected, so log it.
      if (error.code === "23505") return { error: "That slug is already in use." };
      console.error("saveMockTest: update failed", error);
      return { error: "Could not save the test." };
    }
    revalidatePath("/admin/mock-tests");
    return {};
  }

  const { data: created, error } = await supabase
    .from("mock_tests")
    .insert(row)
    .select("id")
    .single();
  if (error || !created) {
    if (error?.code === "23505") return { error: "That slug is already in use." };
    console.error("saveMockTest: insert failed", error);
    return { error: "Could not create the test." };
  }
  revalidatePath("/admin/mock-tests");
  redirect(`/admin/mock-tests/${created.id}/edit`);
}

export async function deleteMockTest(id: string): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("mock_tests").delete().eq("id", id);
  if (error) {
    console.error("deleteMockTest: delete failed", error);
    return { error: "Could not delete the mock test. Please try again." };
  }
  revalidatePath("/admin/mock-tests");
  return {};
}

export async function addQuestion(
  testId: string,
  input: {
    question: string;
    options: { key: string; label: string }[];
    correct_key: string;
    explanation: string;
  },
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  if (!input.question.trim()) return { error: "Enter a question." };
  if (input.options.length < 2) return { error: "Add at least two options." };
  if (!input.options.some((o) => o.key === input.correct_key)) {
    return { error: "Pick the correct option." };
  }

  // Non-fatal: a failed count only degrades the sort_order default.
  const { count } = await supabase
    .from("mock_questions")
    .select("id", { count: "exact", head: true })
    .eq("mock_test_id", testId);

  // The insert result was discarded here, so a constraint violation or an RLS
  // denial still produced a success toast with no question saved. Check it like
  // deleteMockTest does.
  const { error } = await supabase.from("mock_questions").insert({
    mock_test_id: testId,
    question: input.question.trim(),
    options: input.options as unknown as Json,
    correct_key: input.correct_key,
    explanation: input.explanation.trim() || null,
    sort_order: count ?? 0,
  });
  if (error) {
    console.error("addQuestion: insert failed", error);
    return { error: "Could not add the question. Please try again." };
  }
  revalidatePath(`/admin/mock-tests/${testId}/edit`);
  return {};
}

export async function deleteQuestion(
  questionId: string,
  testId: string,
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  // Was fire-and-forget: a blocked delete reported success and the question
  // reappeared on the next refresh. Match deleteMockTest's handling.
  const { error } = await supabase.from("mock_questions").delete().eq("id", questionId);
  if (error) {
    console.error("deleteQuestion: delete failed", error);
    return { error: "Could not delete the question. Please try again." };
  }
  revalidatePath(`/admin/mock-tests/${testId}/edit`);
  return {};
}
