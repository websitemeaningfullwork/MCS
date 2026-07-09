"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type McqOption = { key: string; label: string };

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

  await supabase.from("test_attempts").insert({
    user_id: user.id,
    mock_test_id: testId,
    score,
    total: questions.length,
    answers,
    submitted_at: new Date().toISOString(),
  });

  return { score, total: questions.length, results };
}
