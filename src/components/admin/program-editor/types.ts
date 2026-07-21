export type Level = "beginner" | "intermediate" | "advanced" | "all_levels";
export type ProgramStatus = "draft" | "published" | "hidden";
export type ClassStatus = "draft" | "published" | "hidden";
export type ResourceType = "pdf" | "docx" | "ppt" | "zip" | "link" | "drive" | "other";
export type QuestionType = "mcq" | "true_false" | "short";

export type Resource = {
  id: string;
  title: string;
  type: ResourceType;
  file_url: string | null;
  external_url: string | null;
  sort_order: number;
};

export type Question = {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string | null;
  explanation: string | null;
  sort_order: number;
};

export type ClassItem = {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  overview_html: string | null;
  thumbnail_url: string | null;
  admin_notes: string | null;
  status: ClassStatus;
  is_preview: boolean;
  duration_seconds: number | null;
  sort_order: number;
  resources: Resource[];
  questions: Question[];
};

export type Season = {
  id: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  classes: ClassItem[];
};

export type MentorOption = {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
};

export type AssignedMentor = {
  mentor_id: string;
  is_primary: boolean;
  sort_order: number;
};

export type CategoryOption = { id: string; name: string };

export type ProgramInfo = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  cover_url: string | null;
  preview_video_url: string;
  category_id: string | null;
  level: Level;
  status: ProgramStatus;
  price_bdt: number;
  discount_bdt: number;
  is_featured: boolean;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Wraps a mutating server action with save-status reporting. */
export type SaveFn = (fn: () => Promise<{ error?: string }>) => Promise<boolean>;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  pdf: "PDF",
  docx: "DOCX",
  ppt: "PPT",
  zip: "ZIP",
  link: "Link",
  drive: "Drive",
  other: "Other",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  short: "Short answer",
};
