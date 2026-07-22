export type PublicReview = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  verified_buyer: boolean;
  scope?: string;
  program_title?: string;
  program_slug?: string;
};

export type RatingSummary = {
  count: number;
  average: number;
  /** counts per star, index 0 = 1★ … index 4 = 5★ */
  histogram: [number, number, number, number, number];
};

export function summarize(reviews: { rating: number }[]): RatingSummary {
  const histogram: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    histogram[idx] += 1;
  }
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  return { count, average, histogram };
}
