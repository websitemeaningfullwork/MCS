import { z } from "zod";

export const reviewScopes = ["lesson", "season", "course"] as const;
export const reviewStatuses = ["pending", "approved", "hidden", "reported"] as const;

export type ReviewScope = (typeof reviewScopes)[number];
export type ReviewStatus = (typeof reviewStatuses)[number];

export const submitReviewSchema = z
  .object({
    programId: z.string().uuid(),
    scope: z.enum(reviewScopes),
    lessonId: z.string().uuid().nullish(),
    moduleId: z.string().uuid().nullish(),
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => (v.scope === "lesson" ? Boolean(v.lessonId) : true), {
    message: "A lesson is required for a lesson review.",
    path: ["lessonId"],
  })
  .refine((v) => (v.scope === "season" ? Boolean(v.moduleId) : true), {
    message: "A season is required for a season review.",
    path: ["moduleId"],
  });

export type SubmitReviewInput = z.input<typeof submitReviewSchema>;

export const updateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).nullish(),
});
