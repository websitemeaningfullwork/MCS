"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp } from "@/lib/rate-limit";
import { notify, adminNotification } from "@/features/notifications/service";
import {
  generateMentorSlots,
  formatSlotLabel,
  toMinutes,
  todayInDhaka,
  type MentorAvailability,
} from "./slots";
import {
  createAppointmentSchema,
  appointmentPaymentSchema,
  type CreateAppointmentInput,
  type AppointmentPaymentInput,
} from "./schema";

export type SlotStatus = "available" | "booked";
export type DaySlot = { time: string; label: string; status: SlotStatus };
export type MentorCard = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  rating: number | null;
  reviews_count: number | null;
  is_verified: boolean | null;
  session_price_bdt: number;
  session_duration: number | null;
  currency: string;
};

type MentorRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  rating: number | null;
  reviews_count: number | null;
  is_verified: boolean | null;
  availability: MentorAvailability | null;
  session_duration: number | null;
  session_price_bdt: number;
  currency: string;
};

/** Active mentors with the fields booking needs (public_mentors is active-only). */
async function loadActiveMentors(): Promise<MentorRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_mentors")
    .select(
      "id, full_name, avatar_url, headline, rating, reviews_count, is_verified, availability, session_duration, session_price_bdt, currency",
    );
  return (data ?? []) as unknown as MentorRow[];
}

/**
 * Booked (mentor_id, start_time) tuples for a date across all mentors. Read with
 * the service role: a student cannot see others' appointment rows under RLS, but
 * knowing which slots are taken is not sensitive. We select only the minimum.
 */
async function bookedByMentor(dateISO: string): Promise<Map<string, Set<string>>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("mentor_id, start_time")
    .eq("appointment_date", dateISO)
    .neq("status", "cancelled");
  const map = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    if (!map.has(row.mentor_id)) map.set(row.mentor_id, new Set());
    map.get(row.mentor_id)!.add(row.start_time);
  }
  return map;
}

function maxPerDay(a: MentorAvailability | null | undefined): number | null {
  const n = a?.max_per_day;
  return typeof n === "number" && n > 0 ? n : null;
}

/**
 * Union of slot times any active mentor offers on a date. A time is `available`
 * if at least one mentor still has it free, otherwise `booked`. Past dates yield
 * nothing.
 */
export async function getDaySlots(dateISO: string): Promise<{ slots: DaySlot[]; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return { slots: [], error: "Invalid date." };
  if (dateISO < todayInDhaka()) return { slots: [] };

  const [mentors, booked] = await Promise.all([loadActiveMentors(), bookedByMentor(dateISO)]);

  // time -> { offering, free }
  const agg = new Map<string, { offering: number; free: number }>();
  for (const m of mentors) {
    const slots = generateMentorSlots(m.availability, m.session_duration, dateISO);
    const taken = booked.get(m.id) ?? new Set<string>();
    const cap = maxPerDay(m.availability);
    const dayFull = cap !== null && taken.size >= cap;
    for (const s of slots) {
      const entry = agg.get(s.start) ?? { offering: 0, free: 0 };
      entry.offering += 1;
      if (!dayFull && !taken.has(s.start)) entry.free += 1;
      agg.set(s.start, entry);
    }
  }

  const slots: DaySlot[] = [...agg.entries()]
    .sort((a, b) => toMinutes(a[0]) - toMinutes(b[0]))
    .map(([time, e]) => ({
      time,
      label: formatSlotLabel(time),
      status: e.free > 0 ? "available" : "booked",
    }));

  return { slots };
}

/** Mentors available (working + free) at a specific date & slot. */
export async function getMentorsForSlot(
  dateISO: string,
  time: string,
): Promise<{ mentors: MentorCard[]; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || !/^\d{2}:\d{2}$/.test(time)) {
    return { mentors: [], error: "Invalid slot." };
  }
  const [mentors, booked] = await Promise.all([loadActiveMentors(), bookedByMentor(dateISO)]);

  const available = mentors.filter((m) => {
    const slots = generateMentorSlots(m.availability, m.session_duration, dateISO);
    if (!slots.some((s) => s.start === time)) return false;
    const taken = booked.get(m.id) ?? new Set<string>();
    if (taken.has(time)) return false;
    const cap = maxPerDay(m.availability);
    if (cap !== null && taken.size >= cap) return false;
    return true;
  });

  return {
    mentors: available.map((m) => ({
      id: m.id,
      full_name: m.full_name ?? "MCA Mentor",
      avatar_url: m.avatar_url,
      headline: m.headline,
      rating: m.rating,
      reviews_count: m.reviews_count,
      is_verified: m.is_verified,
      session_price_bdt: m.session_price_bdt,
      session_duration: m.session_duration,
      currency: m.currency,
    })),
  };
}

/** Create a pending appointment and hand off to the payment page. */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<{ error?: string; id?: string }> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your booking." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to book an appointment." };

  if (!(await rateLimitByIp(`appointment:${user.id}`, 8, 60_000))) {
    return { error: "Too many booking attempts. Please wait a minute and try again." };
  }

  if (v.date < todayInDhaka()) return { error: "Please choose a date in the future." };

  // Mentor must be active + expose the slot (public_mentors is active-only).
  const { data: mentor } = await supabase
    .from("public_mentors")
    .select("id, availability, session_duration, session_price_bdt, currency, full_name")
    .eq("id", v.mentor_id)
    .maybeSingle();
  if (!mentor) return { error: "That mentor is not available. Please pick another." };

  const slots = generateMentorSlots(
    mentor.availability as unknown as MentorAvailability,
    mentor.session_duration,
    v.date,
  );
  const slot = slots.find((s) => s.start === v.start_time);
  if (!slot) return { error: "That time is no longer offered. Please pick another slot." };

  // Pre-check the slot is free (the unique index is the real guard).
  const admin = createAdminClient();
  const { data: clash } = await admin
    .from("appointments")
    .select("id")
    .eq("mentor_id", v.mentor_id)
    .eq("appointment_date", v.date)
    .eq("start_time", v.start_time)
    .neq("status", "cancelled")
    .maybeSingle();
  if (clash) return { error: "Sorry, that slot was just booked. Please choose another." };

  const duration = mentor.session_duration && mentor.session_duration > 0
    ? mentor.session_duration
    : toMinutes(slot.end) - toMinutes(slot.start);
  const amount = mentor.session_price_bdt ?? 0;

  const { data: created, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      mentor_id: v.mentor_id,
      type_id: v.type_id,
      appointment_date: v.date,
      start_time: v.start_time,
      end_time: slot.end,
      duration,
      amount_bdt: amount,
      payment_status: "unpaid",
      status: "pending",
      details: {
        ...v.details,
        note: v.details.note ?? "",
        type_name: v.type_name,
        topic: v.topic ?? "",
        mentor_name: mentor.full_name ?? null,
        currency: mentor.currency ?? "BDT",
      },
    })
    .select("id")
    .maybeSingle();

  if (error || !created) {
    // 23505 = the slot unique index (race with another booking).
    if (error?.code === "23505") {
      return { error: "Sorry, that slot was just booked. Please choose another." };
    }
    console.error("createAppointment: insert failed", error);
    return { error: "Could not create your appointment. Please try again." };
  }

  revalidatePath("/dashboard/appointments");
  return { id: created.id };
}

/** Student submits the manual bKash TrxID for a pending appointment. */
export async function submitAppointmentPayment(
  input: AppointmentPaymentInput,
): Promise<{ error?: string }> {
  const parsed = appointmentPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, user_id, mentor_id, payment_status, appointment_date, start_time, details")
    .eq("id", v.appointment_id)
    .maybeSingle();
  if (!appt || appt.user_id !== user.id) return { error: "Appointment not found." };
  if (appt.payment_status === "paid") return { error: "This appointment is already paid." };

  // Screenshot (optional) must live in the caller's own folder.
  let safePath: string | null = null;
  if (v.screenshot_path) {
    if (!v.screenshot_path.startsWith(`${user.id}/`) || v.screenshot_path.includes("..")) {
      return { error: "Invalid screenshot reference." };
    }
    safePath = v.screenshot_path;
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      sender_number: v.sender_number,
      transaction_id: v.transaction_id,
      paid_amount_bdt: v.paid_amount_bdt,
      screenshot_path: safePath,
      payment_status: "submitted",
    })
    .eq("id", v.appointment_id);
  if (error) {
    console.error("submitAppointmentPayment: update failed", error);
    return { error: "Could not submit your payment. Please try again." };
  }

  const details = (appt.details ?? {}) as Record<string, unknown>;
  const studentName = String(details.full_name ?? "A student");
  const when = `${appt.appointment_date} ${appt.start_time}`;

  await notify([
    {
      user_id: appt.user_id,
      role: "student",
      type: "appointment_booked",
      title: "Booking received",
      body: `Your session is reserved for ${when}. We'll confirm once payment is verified.`,
      payload: { appointment_id: appt.id },
    },
    {
      user_id: appt.mentor_id,
      role: "mentor",
      type: "appointment_new",
      title: "New appointment booked",
      body: `${studentName} booked a session with you for ${when}.`,
      payload: { appointment_id: appt.id },
    },
    adminNotification(
      "appointment_payment",
      "New booking — payment submitted",
      `${studentName} submitted payment for ${when}.`,
      { appointment_id: appt.id },
    ),
  ]);

  revalidatePath("/dashboard/appointments");
  revalidatePath("/admin/appointments");
  redirect(`/appointments/${v.appointment_id}/confirmation`);
}

/** Student cancels their own upcoming appointment. */
export async function cancelAppointment(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, user_id, mentor_id, status, appointment_date, start_time, details")
    .eq("id", id)
    .maybeSingle();
  if (!appt || appt.user_id !== user.id) return { error: "Appointment not found." };
  if (["cancelled", "completed"].includes(appt.status)) {
    return { error: "This appointment can no longer be cancelled." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { error: "Could not cancel the appointment." };

  const details = (appt.details ?? {}) as Record<string, unknown>;
  const studentName = String(details.full_name ?? "A student");
  await notify([
    {
      user_id: appt.mentor_id,
      role: "mentor",
      type: "appointment_cancelled",
      title: "Appointment cancelled",
      body: `${studentName} cancelled the ${appt.appointment_date} ${appt.start_time} session.`,
      payload: { appointment_id: appt.id },
    },
    adminNotification(
      "appointment_cancelled",
      "Appointment cancelled",
      `${studentName} cancelled a ${appt.appointment_date} session.`,
      { appointment_id: appt.id },
    ),
  ]);

  revalidatePath("/dashboard/appointments");
  revalidatePath("/admin/appointments");
  return {};
}

/**
 * Free slots for the mentor attached to one of the caller's appointments, on a
 * given date — powers the "reschedule" picker in My Appointments.
 */
export async function getRescheduleSlots(
  appointmentId: string,
  dateISO: string,
): Promise<{ slots: DaySlot[]; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return { slots: [], error: "Invalid date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { slots: [], error: "Please log in." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, user_id, mentor_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt || appt.user_id !== user.id) return { slots: [], error: "Appointment not found." };
  if (dateISO < todayInDhaka()) return { slots: [] };

  const { data: mentor } = await supabase
    .from("public_mentors")
    .select("availability, session_duration")
    .eq("id", appt.mentor_id)
    .maybeSingle();
  const allSlots = generateMentorSlots(
    (mentor?.availability ?? null) as unknown as MentorAvailability,
    mentor?.session_duration ?? null,
    dateISO,
  );

  const admin = createAdminClient();
  const { data: booked } = await admin
    .from("appointments")
    .select("start_time")
    .eq("mentor_id", appt.mentor_id)
    .eq("appointment_date", dateISO)
    .neq("status", "cancelled")
    .neq("id", appointmentId);
  const taken = new Set((booked ?? []).map((b) => b.start_time));

  return {
    slots: allSlots.map((s) => ({
      time: s.start,
      label: formatSlotLabel(s.start),
      status: taken.has(s.start) ? "booked" : "available",
    })),
  };
}

/** Student reschedules their own appointment to a free slot. */
export async function rescheduleAppointment(
  id: string,
  date: string,
  time: string,
): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Choose a valid date and time." };
  }
  if (date < todayInDhaka()) return { error: "Choose a future date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, user_id, mentor_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!appt || appt.user_id !== user.id) return { error: "Appointment not found." };
  if (["cancelled", "completed"].includes(appt.status)) {
    return { error: "This appointment can no longer be rescheduled." };
  }

  // The mentor must offer the new slot and it must be free.
  const { data: mentor } = await supabase
    .from("public_mentors")
    .select("availability, session_duration")
    .eq("id", appt.mentor_id)
    .maybeSingle();
  const slots = generateMentorSlots(
    (mentor?.availability ?? null) as unknown as MentorAvailability,
    mentor?.session_duration ?? null,
    date,
  );
  const slot = slots.find((s) => s.start === time);
  if (!slot) return { error: "That mentor isn't available then. Pick another slot." };

  const admin = createAdminClient();
  const { data: clash } = await admin
    .from("appointments")
    .select("id")
    .eq("mentor_id", appt.mentor_id)
    .eq("appointment_date", date)
    .eq("start_time", time)
    .neq("status", "cancelled")
    .neq("id", id)
    .maybeSingle();
  if (clash) return { error: "That slot is taken. Please choose another." };

  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: date,
      start_time: time,
      end_time: slot.end,
      status: "rescheduled",
    })
    .eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "That slot is taken. Please choose another." };
    }
    return { error: "Could not reschedule the appointment." };
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/admin/appointments");
  return {};
}
