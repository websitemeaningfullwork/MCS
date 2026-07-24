/**
 * Pure slot-generation helpers (no server/client boundary) shared by the
 * booking wizard, the server actions, and the admin schedule view.
 *
 * Slots are derived from a mentor's `availability` jsonb (Chunk 6) +
 * `session_duration`: working days, a daily start/end window, break windows, and
 * two optional appointment-system extensions this chunk manages — `max_per_day`
 * (cap) and `unavailable_dates` (holidays / temporary blocks).
 */

export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

const WEEKDAY_BY_INDEX: WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export type MentorAvailability = {
  working_days?: string[];
  start_time?: string;
  end_time?: string;
  breaks?: { start: string; end: string }[];
  max_per_day?: number | null;
  unavailable_dates?: string[];
};

export type Slot = { start: string; end: string };

/** 'HH:MM' → minutes past midnight. Returns NaN on malformed input. */
export function toMinutes(hhmm: string | null | undefined): number {
  if (!hhmm) return NaN;
  const [h, m] = hhmm.split(":");
  const hours = Number(h);
  const mins = Number(m);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return NaN;
  return hours * 60 + mins;
}

/** minutes past midnight → 'HH:MM' (24h, zero-padded). */
export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 'HH:MM' → '8:00 AM' style label. */
export function formatSlotLabel(hhmm: string): string {
  const total = toMinutes(hhmm);
  if (Number.isNaN(total)) return hhmm;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Weekday key for a 'YYYY-MM-DD' date (parsed as a calendar date, TZ-safe). */
export function weekdayKey(dateISO: string): WeekdayKey | null {
  const [y, mo, d] = dateISO.split("-").map(Number);
  if (!y || !mo || !d) return null;
  const idx = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return WEEKDAY_BY_INDEX[idx] ?? null;
}

function overlapsBreak(
  start: number,
  end: number,
  breaks: { start: string; end: string }[],
): boolean {
  for (const br of breaks) {
    const bs = toMinutes(br.start);
    const be = toMinutes(br.end);
    if (Number.isNaN(bs) || Number.isNaN(be)) continue;
    if (start < be && end > bs) return true;
  }
  return false;
}

/**
 * Generate the ordered list of bookable slots a mentor offers on a given date,
 * honouring working days, the start/end window, breaks, and holiday dates.
 * Returns [] when the mentor does not work that day.
 */
export function generateMentorSlots(
  availability: MentorAvailability | null | undefined,
  sessionDuration: number | null | undefined,
  dateISO: string,
): Slot[] {
  const a = availability ?? {};
  const workingDays = a.working_days ?? [];
  const key = weekdayKey(dateISO);
  if (!key || !workingDays.includes(key)) return [];
  if ((a.unavailable_dates ?? []).includes(dateISO)) return [];

  const startWindow = toMinutes(a.start_time ?? "09:00");
  const endWindow = toMinutes(a.end_time ?? "17:00");
  const step = sessionDuration && sessionDuration > 0 ? sessionDuration : 120;
  if (Number.isNaN(startWindow) || Number.isNaN(endWindow) || endWindow <= startWindow) {
    return [];
  }

  const breaks = a.breaks ?? [];
  const slots: Slot[] = [];
  for (let t = startWindow; t + step <= endWindow; t += step) {
    if (overlapsBreak(t, t + step, breaks)) continue;
    slots.push({ start: toHHMM(t), end: toHHMM(t + step) });
  }
  return slots;
}

/** Today's date in Asia/Dhaka (GMT+6) as 'YYYY-MM-DD' — the platform time zone. */
export function todayInDhaka(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Current wall-clock time in Asia/Dhaka as minutes past midnight.
 *
 * `now` is injectable so the past-slot rules below stay pure & unit-testable —
 * production callers just use the real clock. We read `formatToParts` with an
 * explicit `hourCycle: "h23"` rather than `hour12: false`, because the latter
 * can render midnight as "24:00" in some locales/ICU builds, which would make
 * 00:xx look like the *end* of the day instead of the start.
 */
export function nowMinutesInDhaka(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return (hour % 24) * 60 + minute;
}

/**
 * Minimum notice, in minutes, between "now" and the start of a bookable slot.
 *
 * WHY: a slot that starts in 90 seconds is technically still in the future but
 * useless — nobody can pay, be verified and join in time, and it invites the
 * "I booked it at 08:59 for 09:00" support ticket. Small, named and exported so
 * both the slot list and the server-side guard use the exact same number.
 */
export const BOOKING_LEAD_MINUTES = 15;

/**
 * True when a slot may no longer be booked because its start time has passed
 * (or is within `BOOKING_LEAD_MINUTES`) in Dhaka time.
 *
 * Handles all three cases in one place so `getDaySlots`, `createAppointment`,
 * `getRescheduleSlots` and `rescheduleAppointment` cannot drift apart:
 *   - an earlier calendar date  → always past
 *   - a later calendar date     → never past
 *   - today                     → compare the slot time against the Dhaka clock
 *
 * A malformed time is treated as past (refuse to book what we cannot reason
 * about); callers validate the 'HH:MM' shape before reaching the DB anyway.
 */
export function isSlotPast(
  dateISO: string,
  startHHMM: string,
  now: Date = new Date(),
): boolean {
  const today = todayInDhaka(now);
  if (dateISO < today) return true;
  if (dateISO > today) return false;

  const start = toMinutes(startHHMM);
  if (Number.isNaN(start)) return true;
  const nowMinutes = nowMinutesInDhaka(now);
  if (Number.isNaN(nowMinutes)) return false;
  return start < nowMinutes + BOOKING_LEAD_MINUTES;
}
