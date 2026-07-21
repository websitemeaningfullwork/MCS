export type PlayerResourceType =
  | "pdf"
  | "docx"
  | "ppt"
  | "zip"
  | "link"
  | "drive"
  | "other";

export type PlayerResource = {
  id: string;
  title: string;
  type: PlayerResourceType;
  file_url: string | null;
  external_url: string | null;
};

export type PlayerQuestion = {
  id: string;
  type: "mcq" | "true_false" | "short";
  question: string;
  options: string[];
  correct_answer: string | null;
  explanation: string | null;
};

export type PlayerLesson = {
  id: string;
  title: string;
  video_url: string | null;
  overview_html: string | null;
  content_md: string | null;
  admin_notes: string | null;
  duration_seconds: number | null;
  is_preview: boolean;
  resources: PlayerResource[];
  questions: PlayerQuestion[];
};

export type PlayerSeason = {
  id: string;
  title: string;
  subtitle: string | null;
  lessons: PlayerLesson[];
};

export type PlayerTab = "overview" | "resources" | "qa" | "notes";

/** Format a duration in seconds as m:ss (or h:mm:ss). */
export function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
