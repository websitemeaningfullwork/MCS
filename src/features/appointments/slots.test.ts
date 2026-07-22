import { describe, it, expect } from "vitest";
import {
  toMinutes,
  toHHMM,
  formatSlotLabel,
  weekdayKey,
  generateMentorSlots,
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
