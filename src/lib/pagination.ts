/**
 * Server-safe pagination helpers. Kept out of the `"use client"` Pagination
 * component so server components can call them (a client-module export cannot
 * be invoked from the server).
 */

/** Clamp a raw `?page=` value to a positive integer. */
export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
