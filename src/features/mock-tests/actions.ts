"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp } from "@/lib/rate-limit";

export type McqOption = { key: string; label: string };

// Bound the untrusted answers payload: map of question-id -> selected option key.
// Caps key/value length and total size so a caller can't post a huge object.
const answersSchema = z.record(
  z.string().uuid(),
  z.string().max(16),
).refine((a) => Object.keys(a).length <= 500, {
  message: "Too many answers.",
});

export type AttemptResult = {
  score: number;
  total: number;
  results: {
    id: string;
    question: string;
    options: McqOption[];
    selected: string | null;
    correctKey: string;
    correct: boolean;
    explanation: string | null;
  }[];
};

/**
 * Score a mock-test attempt SERVER-SIDE (never trust the client). Correct
 * answers are only read here; the attempt page never receives correct_key.
 */
export async function submitAttempt(
  testId: string,
  answers: Record<string, string>,
): Promise<{ error: string } | AttemptResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to submit your attempt." };

  // Validate the untrusted answers payload before doing any work.
  const parsedAnswers = answersSchema.safeParse(answers);
  if (!parsedAnswers.success) return { error: "Your answers could not be read. Please retry." };
  answers = parsedAnswers.data;

  // Throttle attempts per user (assessment integrity + insert-spam guard).
  if (!(await rateLimitByIp(`attempt:${user.id}`, 10, 60_000))) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  // Gate access: only free tests are attemptable until a paid-test access
  // model exists. Prevents scoring paid assessments for free.
  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, is_free")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return { error: "This test is not available." };
  if (!test.is_free) return { error: "This test requires purchase." };

  // Answer keys live in the admin-only base table — read them with the service
  // role here (server-side scoring only; the client never sees correct_key).
  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("mock_questions")
    .select("id, question, options, correct_key, explanation")
    .eq("mock_test_id", testId)
    .order("sort_order", { ascending: true });

  if (!questions || questions.length === 0) {
    return { error: "This test has no questions yet." };
  }

  let score = 0;
  const results = questions.map((q) => {
    const selected = answers[q.id] ?? null;
    const correct = selected !== null && selected === q.correct_key;
    if (correct) score += 1;
    return {
      id: q.id,
      question: q.question,
      options: (q.options as McqOption[]) ?? [],
      selected,
      correctKey: q.correct_key,
      correct,
      explanation: q.explanation,
    };
  });

  const { error: insertErr } = await supabase.from("test_attempts").insert({
    user_id: user.id,
    mock_test_id: testId,
    score,
    total: questions.length,
    answers,
    submitted_at: new Date().toISOString(),
  });
  if (insertErr) {
    console.error("submitAttempt: test_attempts insert failed", insertErr);
    // The attempt was still scored — return the result rather than losing the
    // user's work; the missing history row is logged for follow-up.
  }

  return { score, total: questions.length, results };
}
