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

/** Bangla counterparts of the level labels (loanword register, matching BD ed-tech). */
const LEVEL_LABELS_BN: Record<string, string> = {
  beginner: "বিগিনার",
  intermediate: "ইন্টারমিডিয়েট",
  advanced: "অ্যাডভান্সড",
  all_levels: "সব লেভেল",
};

export function levelLabelBn(level: string | null | undefined): string {
  if (!level) return "সব লেভেল";
  return LEVEL_LABELS_BN[level] ?? "সব লেভেল";
}

/** Compact relative time, e.g. "2 days ago", "1 week ago". */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = secs;
  let unit = "second";
  for (const [size, name] of units) {
    if (value < size) {
      unit = name;
      break;
    }
    value = Math.floor(value / size);
    unit = name;
  }
  if (unit === "second" && value < 45) return "just now";
  const rounded = Math.max(1, value);
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}
