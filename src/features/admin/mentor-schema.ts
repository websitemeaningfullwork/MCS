import { z } from "zod";

import { optionalHttpUrlSchema } from "@/lib/safe-url";

export const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]["key"];

export const mentorStatuses = ["active", "inactive", "hidden", "draft"] as const;
export type MentorStatus = (typeof mentorStatuses)[number];

/** Session-duration options (minutes) → labels for the dropdown. */
export const SESSION_DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "Up to 2 hours" },
] as const;

const breakSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const availabilitySchema = z.object({
  working_days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).default([]),
  start_time: z.string().default("09:00"),
  end_time: z.string().default("17:00"),
  breaks: z.array(breakSchema).default([]),
});

export type Availability = z.infer<typeof availabilitySchema>;

export const DEFAULT_AVAILABILITY: Availability = {
  working_days: ["mon", "tue", "wed", "thu", "fri"],
  start_time: "09:00",
  end_time: "17:00",
  breaks: [],
};

export const saveMentorSchema = z.object({
  id: z.string().uuid(),
  // Basic
  full_name: z.string().min(2, "Enter the mentor's name."),
  headline: z.string().trim().max(160).optional().default(""),
  bio: z.string().trim().max(600).optional().default(""),
  avatar_url: z.string().nullable().optional(),
  // Contact
  phone: z.string().trim().max(40).optional().default(""),
  whatsapp: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().max(160).optional().default(""),
  show_phone: z.boolean().default(true),
  show_whatsapp: z.boolean().default(true),
  show_email: z.boolean().default(false),
  // Expertise / skills
  expertise: z.array(z.string().trim().min(1)).default([]),
  skills: z.array(z.string().trim().min(1)).default([]),
  // Professional
  years_experience: z.number().int().min(0).max(80).default(0),
  highest_qualification: z.string().trim().max(120).optional().default(""),
  current_position: z.string().trim().max(160).optional().default(""),
  organization: z.string().trim().max(160).optional().default(""),
  // Availability
  availability: availabilitySchema,
  // Session & pricing
  session_duration: z.number().int().min(0).nullable().default(60),
  session_price_bdt: z.number().min(0).default(0),
  currency: z.string().trim().max(8).default("BDT"),
  // Social — these render as raw anchors on the public mentor page, so a
  // length-only check is not enough: it accepts `javascript:…`, which executes
  // in our origin the moment a visitor clicks. `optionalHttpUrlSchema` still
  // accepts "" (the form submits empty strings for blank fields) and still
  // yields a plain string, so downstream `|| null` handling is unchanged.
  facebook_url: optionalHttpUrlSchema,
  youtube_url: optionalHttpUrlSchema,
  linkedin_url: optionalHttpUrlSchema,
  // Status
  is_featured: z.boolean().default(false),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  status: z.enum(mentorStatuses).default("active"),
});

export type SaveMentorInput = z.input<typeof saveMentorSchema>;
