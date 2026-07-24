import { describe, it, expect } from "vitest";
import {
  toMinutes,
  toHHMM,
  formatSlotLabel,
  weekdayKey,
  generateMentorSlots,
  todayInDhaka,
  nowMinutesInDhaka,
  isSlotPast,
  BOOKING_LEAD_MINUTES,
} from "./slots";

describe("time helpers", () => {
  it("converts HH:MM to minutes and back", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toHHMM(570)).toBe("09:30");
    expect(toHHMM(0)).toBe("00:00");
  });

  it("formats a 12-hour label", () => {
    expect(formatSlotLabel("00:00")).toBe("12:00 AM");
    expect(formatSlotLabel("08:00")).toBe("8:00 AM");
    expect(formatSlotLabel("12:00")).toBe("12:00 PM");
    expect(formatSlotLabel("14:30")).toBe("2:30 PM");
  });

  it("derives the weekday key TZ-safely", () => {
    // 2026-07-22 is a Wednesday.
    expect(weekdayKey("2026-07-22")).toBe("wed");
  });
});

describe("generateMentorSlots", () => {
  const availability = {
    working_days: ["wed"],
    start_time: "09:00",
    end_time: "17:00",
    breaks: [{ start: "13:00", end: "14:00" }],
  };

  it("returns nothing on a non-working day", () => {
    // 2026-07-23 is a Thursday.
    expect(generateMentorSlots(availability, 120, "2026-07-23")).toEqual([]);
  });

  it("steps by session duration and skips breaks", () => {
    const slots = generateMentorSlots(availability, 120, "2026-07-22");
    // 09-11, 11-13, (skip 13-15 overlaps break), 15-17
    expect(slots.map((s) => s.start)).toEqual(["09:00", "11:00", "15:00"]);
  });

  it("honours holiday/unavailable dates", () => {
    const withHoliday = { ...availability, unavailable_dates: ["2026-07-22"] };
    expect(generateMentorSlots(withHoliday, 120, "2026-07-22")).toEqual([]);
  });

  it("defaults the step to 120 minutes when duration is missing", () => {
    const slots = generateMentorSlots(availability, null, "2026-07-22");
    expect(slots.length).toBeGreaterThan(0);
  });
});

describe("Dhaka clock helpers", () => {
  // Dhaka is a fixed UTC+6 with no DST, so these are exact.
  const at15 = new Date("2026-07-22T09:00:00Z"); // 15:00 Dhaka, 2026-07-22
  const justAfterMidnight = new Date("2026-07-22T18:30:00Z"); // 00:30 Dhaka, 2026-07-23

  it("reads the Dhaka date from an injected clock", () => {
    expect(todayInDhaka(at15)).toBe("2026-07-22");
    // The UTC day is still the 22nd here — Dhaka has already rolled over.
    expect(todayInDhaka(justAfterMidnight)).toBe("2026-07-23");
  });

  it("returns minutes past midnight in Dhaka", () => {
    expect(nowMinutesInDhaka(at15)).toBe(15 * 60);
    // Midnight must be 0, not 1440 — the h23/h24 ('24:00') trap.
    expect(nowMinutesInDhaka(new Date("2026-07-21T18:00:00Z"))).toBe(0);
    expect(nowMinutesInDhaka(justAfterMidnight)).toBe(30);
  });
});

describe("isSlotPast", () => {
  const at15 = new Date("2026-07-22T09:00:00Z"); // 15:00 Dhaka, 2026-07-22

  it("treats whole earlier dates as past and later dates as bookable", () => {
    expect(isSlotPast("2026-07-21", "23:00", at15)).toBe(true);
    expect(isSlotPast("2026-07-23", "00:00", at15)).toBe(false);
  });

  it("rejects times that have already started today", () => {
    expect(isSlotPast("2026-07-22", "09:00", at15)).toBe(true);
    expect(isSlotPast("2026-07-22", "15:00", at15)).toBe(true);
    expect(isSlotPast("2026-07-22", "17:00", at15)).toBe(false);
  });

  it("applies the lead-time buffer to imminent slots", () => {
    const nowMin = 15 * 60;
    expect(isSlotPast("2026-07-22", toHHMM(nowMin + BOOKING_LEAD_MINUTES - 1), at15)).toBe(true);
    expect(isSlotPast("2026-07-22", toHHMM(nowMin + BOOKING_LEAD_MINUTES), at15)).toBe(false);
  });

  it("uses the Dhaka day, not the UTC day, around midnight", () => {
    const justAfterMidnight = new Date("2026-07-22T18:30:00Z"); // 00:30 Dhaka on the 23rd
    expect(isSlotPast("2026-07-22", "23:00", justAfterMidnight)).toBe(true);
    expect(isSlotPast("2026-07-23", "09:00", justAfterMidnight)).toBe(false);
  });

  it("refuses a malformed time rather than letting it through", () => {
    expect(isSlotPast("2026-07-22", "not-a-time", at15)).toBe(true);
  });
});
