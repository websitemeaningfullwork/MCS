import { z } from "zod";

export const createQuestionSchema = z.object({
  title: z.string().min(5, "Give your question a short title."),
  body: z.string().min(10, "Please describe your question."),
  program_id: z.string().uuid().optional().or(z.literal("")),
  mentor_id: z.string().uuid().optional().or(z.literal("")),
});

export const answerSchema = z.object({
  body: z.string().min(1, "Write a reply."),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
