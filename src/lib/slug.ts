/** Convert a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse a textarea (one item per line) into a trimmed string array. */
export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Join a string array back into newline-separated text for editing. */
export function arrayToLines(arr: string[] | null | undefined): string {
  return (arr ?? []).join("\n");
}
