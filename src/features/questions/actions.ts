"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminNotification, notify } from "@/features/notifications/service";
import {
  answerSchema,
  createQuestionSchema,
  type AnswerInput,
  type CreateQuestionInput,
} from "./schemas";

/** Short excerpt of a reply for a notification body. */
function excerpt(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<{ error: string }> {
  const parsed = createQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to ask a question." };

  const { data, error } = await supabase
    .from("questions")
    .insert({
      student_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      program_id: parsed.data.program_id ? parsed.data.program_id : null,
      mentor_id: parsed.data.mentor_id ? parsed.data.mentor_id : null,
      status: "waiting",
      visibility: "private",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not submit your question." };

  // In-app notifications (Chunk 9): alert the assigned mentor + the admin team.
  const rows = [
    adminNotification("question_new", "New student question", excerpt(parsed.data.title), {
      question_id: data.id,
      href: `/admin/questions/${data.id}`,
    }),
  ];
  if (parsed.data.mentor_id) {
    rows.unshift({
      user_id: parsed.data.mentor_id,
      role: "mentor",
      type: "question_new",
      title: "New question for you",
      body: excerpt(parsed.data.title),
      payload: { question_id: data.id, href: `/mentor/questions/${data.id}` },
    });
  }
  await notify(rows);

  redirect(`/dashboard/questions/${data.id}`);
}

export async function postAnswer(
  questionId: string,
  input: AnswerInput,
): Promise<{ error?: string }> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { error: "Please write a reply." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  // Explicit authorization: the caller must be able to see the question
  // (owner, assigned mentor, admin, or a community question). RLS on the read
  // enforces this — if the row is not visible, the caller may not answer it.
  const { data: question } = await supabase
    .from("questions")
    .select("id, student_id, mentor_id, visibility")
    .eq("id", questionId)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = profile?.role === "admin" || profile?.role === "mentor";

  const canAnswer =
    !!question &&
    (question.student_id === user.id ||
      question.mentor_id === user.id ||
      question.visibility === "community" ||
      profile?.role === "admin");
  if (!canAnswer) return { error: "You cannot reply to this question." };

  const { error } = await supabase.from("answers").insert({
    question_id: questionId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: "Could not post your reply." };

  // If the author is staff, mark the question answered.
  if (isStaff) {
    await supabase
      .from("questions")
      .update({ status: "answered" })
      .eq("id", questionId);
  }

  // In-app notifications (Chunk 9): fan the reply out to the other side.
  const preview = excerpt(parsed.data.body);
  if (question.student_id === user.id) {
    // The student replied → alert the assigned mentor, else the admin team.
    await notify(
      question.mentor_id
        ? [
            {
              user_id: question.mentor_id,
              role: "mentor",
              type: "question_reply",
              title: "New reply from your student",
              body: preview,
              payload: { question_id: questionId, href: `/mentor/questions/${questionId}` },
            },
          ]
        : [
            adminNotification("question_reply", "Student replied to a question", preview, {
              question_id: questionId,
              href: `/admin/questions/${questionId}`,
            }),
          ],
    );
  } else if (question.student_id) {
    // A mentor/admin/community member replied → alert the question owner.
    await notify([
      {
        user_id: question.student_id,
        role: "student",
        type: "question_answered",
        title: "Your question has a new reply",
        body: preview,
        payload: { question_id: questionId, href: `/dashboard/questions/${questionId}` },
      },
    ]);
  }

  revalidatePath(`/dashboard/questions/${questionId}`);
  revalidatePath(`/admin/questions/${questionId}`);
  return {};
}

export async function closeQuestion(
  questionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  // Only the question owner, its assigned mentor, or an admin may close it.
  const { data: question } = await supabase
    .from("questions")
    .select("id, student_id, mentor_id")
    .eq("id", questionId)
    .maybeSingle();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const canClose =
    !!question &&
    (question.student_id === user.id ||
      question.mentor_id === user.id ||
      profile?.role === "admin");
  if (!canClose) return { error: "You cannot close this question." };

  const { error } = await supabase
    .from("questions")
    .update({ status: "closed" })
    .eq("id", questionId);
  if (error) return { error: "Could not close the question." };

  revalidatePath(`/admin/questions/${questionId}`);
  revalidatePath(`/dashboard/questions/${questionId}`);
  return {};
}
