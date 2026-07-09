/** Format a BDT amount. Zero / falsy renders as "Free". */
export function formatBDT(amount: number | null | undefined): string {
  if (!amount || amount <= 0) return "Free";
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

/** The price a student actually pays (discounted price if a valid discount exists). */
export function effectivePriceBDT(
  price: number | null | undefined,
  discount: number | null | undefined,
): number {
  const base = price ?? 0;
  if (discount && discount > 0 && discount < base) return discount;
  return base;
}

/** True when a program/resource has an active discount worth showing. */
export function hasDiscount(
  price: number | null | undefined,
  discount: number | null | undefined,
): boolean {
  return Boolean(discount && discount > 0 && price && discount < price);
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All levels",
};

export function levelLabel(level: string | null | undefined): string {
  if (!level) return "All levels";
  return LEVEL_LABELS[level] ?? "All levels";
}
