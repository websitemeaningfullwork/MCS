"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/features/notifications/service";
import { generateMentorSlots, type MentorAvailability } from "./slots";
import {
  appointmentTypeSchema,
  appointmentStatuses,
  paymentStatuses,
  type AppointmentTypeInput,
  type AppointmentStatus,
  type PaymentStatus,
} from "./schema";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin" ? createAdminClient() : null;
}

function revalidateAppointments() {
  revalidatePath("/admin/appointments");
  revalidatePath("/dashboard/appointments");
}

// ============================================================
// Appointment types
// ============================================================

export async function saveAppointmentType(
  input: AppointmentTypeInput,
): Promise<{ error?: string }> {
  const parsed = appointmentTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the type fields." };
  }
  const v = parsed.data;
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };

  const row = {
    name: v.name,
    description: v.description?.trim() ? v.description.trim() : null,
    icon: v.icon || "compass",
    default_price_bdt: v.default_price_bdt,
    default_duration: v.default_duration,
    status: v.status,
    sort_order: v.sort_order,
  };

  const { error } = v.id
    ? await admin.from("appointment_types").update(row).eq("id", v.id)
    : await admin.from("appointment_types").insert(row);
  if (error) {
    console.error("saveAppointmentType failed", error);
    return { error: "Could not save the appointment type." };
  }
  revalidatePath("/admin/appointments");
  revalidatePath("/appointments");
  return {};
}

export async function deleteAppointmentType(id: string): Promise<{ error?: string }> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };
  const { error } = await admin.from("appointment_types").delete().eq("id", id);
  if (error) return { error: "Could not delete the type." };
  revalidatePath("/admin/appointments");
  revalidatePath("/appointments");
  return {};
}

// ============================================================
// Appointment management
// ============================================================

async function loadForNotify(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await admin
    .from("appointments")
    .select("id, user_id, mentor_id, appointment_date, start_time, details")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<{ error?: string }> {
  if (!appointmentStatuses.includes(status)) return { error: "Invalid status." };
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };

  const { error } = await admin.from("appointments").update({ status }).eq("id", id);
  if (error) return { error: "Could not update the appointment." };

  const appt = await loadForNotify(admin, id);
  if (appt) {
    await notify([
      {
        user_id: appt.user_id,
        role: "student",
        type: "appointment_status",
        title: `Appointment ${status.replace("_", " ")}`,
        body: `Your ${appt.appointment_date} ${appt.start_time} session is now ${status.replace("_", " ")}.`,
        payload: { appointment_id: id },
      },
    ]);
  }
  revalidateAppointments();
  return {};
}

export async function updateAppointmentPayment(
  id: string,
  payment_status: PaymentStatus,
): Promise<{ error?: string }> {
  if (!paymentStatuses.includes(payment_status)) return { error: "Invalid payment status." };
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };

  // Marking paid auto-confirms the booking (spec: confirm after payment).
  const patch: { payment_status: PaymentStatus; status?: string } =
    payment_status === "paid" ? { payment_status, status: "confirmed" } : { payment_status };

  const { error } = await admin.from("appointments").update(patch).eq("id", id);
  if (error) return { error: "Could not update the payment status." };

  if (payment_status === "paid") {
    const appt = await loadForNotify(admin, id);
    if (appt) {
      const studentName = String(
        (appt.details as Record<string, unknown> | null)?.full_name ?? "A student",
      );
      await notify([
        {
          user_id: appt.user_id,
          role: "student",
          type: "appointment_confirmed",
          title: "Appointment confirmed",
          body: `Payment verified — your ${appt.appointment_date} ${appt.start_time} session is confirmed.`,
          payload: { appointment_id: id },
        },
        {
          user_id: appt.mentor_id,
          role: "mentor",
          type: "payment_received",
          title: "Payment received",
          body: `Payment received for the ${appt.appointment_date} session with ${studentName}.`,
          payload: { appointment_id: id },
        },
      ]);
    }
  }
  revalidateAppointments();
  return {};
}

export async function changeAppointmentMentor(
  id: string,
  mentorId: string,
): Promise<{ error?: string }> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: mentor } = await admin
    .from("mentors")
    .select("id")
    .eq("id", mentorId)
    .maybeSingle();
  if (!mentor) return { error: "Mentor not found." };

  const { error } = await admin
    .from("appointments")
    .update({ mentor_id: mentorId })
    .eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "That mentor already has a booking in this slot." };
    }
    return { error: "Could not change the mentor." };
  }

  const appt = await loadForNotify(admin, id);
  if (appt) {
    await notify([
      {
        user_id: appt.user_id,
        role: "student",
        type: "appointment_mentor_changed",
        title: "Mentor updated",
        body: `The mentor for your ${appt.appointment_date} session has been updated.`,
        payload: { appointment_id: id },
      },
    ]);
  }
  revalidateAppointments();
  return {};
}

export async function adminRescheduleAppointment(
  id: string,
  date: string,
  time: string,
): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Choose a valid date and time." };
  }
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: appt } = await admin
    .from("appointments")
    .select("id, mentor_id, user_id, duration")
    .eq("id", id)
    .maybeSingle();
  if (!appt) return { error: "Appointment not found." };

  const { error } = await admin
    .from("appointments")
    .update({ appointment_date: date, start_time: time, status: "rescheduled" })
    .eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "That slot is already booked." };
    }
    return { error: "Could not reschedule." };
  }

  await notify([
    {
      user_id: appt.user_id,
      role: "student",
      type: "appointment_rescheduled",
      title: "Appointment rescheduled",
      body: `Your session has been moved to ${date} at ${time}.`,
      payload: { appointment_id: id },
    },
  ]);
  revalidateAppointments();
  return {};
}

export async function setMeetingLink(id: string, link: string): Promise<{ error?: string }> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };
  const clean = link.trim() ? link.trim() : null;
  const { error } = await admin
    .from("appointments")
    .update({ meeting_link: clean })
    .eq("id", id);
  if (error) return { error: "Could not save the meeting link." };
  revalidateAppointments();
  return {};
}

export async function deleteAppointment(id: string): Promise<{ error?: string }> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };
  const { error } = await admin.from("appointments").delete().eq("id", id);
  if (error) return { error: "Could not delete the appointment." };
  revalidateAppointments();
  return {};
}

// ============================================================
// Mentor schedule (availability jsonb + cap + holidays)
// ============================================================

export async function saveMentorSchedule(
  mentorId: string,
  availability: MentorAvailability,
): Promise<{ error?: string }> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Not authorized." };

  // Light validation of the times / holidays so we never persist garbage.
  const clean: MentorAvailability = {
    working_days: (availability.working_days ?? []).filter((d) =>
      ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].includes(d),
    ),
    start_time: availability.start_time ?? "09:00",
    end_time: availability.end_time ?? "17:00",
    breaks: (availability.breaks ?? []).filter((b) => b.start && b.end),
    max_per_day:
      typeof availability.max_per_day === "number" && availability.max_per_day > 0
        ? Math.floor(availability.max_per_day)
        : null,
    unavailable_dates: (availability.unavailable_dates ?? []).filter((d) =>
      /^\d{4}-\d{2}-\d{2}$/.test(d),
    ),
  };

  const { error } = await admin
    .from("mentors")
    .update({ availability: clean })
    .eq("id", mentorId);
  if (error) return { error: "Could not save the schedule." };

  revalidatePath("/admin/appointments");
  revalidatePath(`/mentors/${mentorId}`);
  revalidatePath("/appointments");
  return {};
}

/** Read a mentor's derived slots for a date (admin schedule/calendar view). */
export async function getMentorDaySlots(
  mentorId: string,
  dateISO: string,
): Promise<{ slots: { start: string; end: string; booked: boolean }[] }> {
  const admin = await assertAdmin();
  if (!admin) return { slots: [] };

  const { data: mentor } = await admin
    .from("mentors")
    .select("availability, session_duration")
    .eq("id", mentorId)
    .maybeSingle();
  const slots = generateMentorSlots(
    (mentor?.availability ?? null) as unknown as MentorAvailability,
    mentor?.session_duration ?? null,
    dateISO,
  );
  const { data: booked } = await admin
    .from("appointments")
    .select("start_time")
    .eq("mentor_id", mentorId)
    .eq("appointment_date", dateISO)
    .neq("status", "cancelled");
  const taken = new Set((booked ?? []).map((b) => b.start_time));
  return {
    slots: slots.map((s) => ({ ...s, booked: taken.has(s.start) })),
  };
}
