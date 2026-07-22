import { z } from "zod";

/** Booking lifecycle statuses (client + server share these). */
export const appointmentStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const paymentStatuses = ["unpaid", "submitted", "paid", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  no_show: "No Show",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  submitted: "Awaiting Verification",
  paid: "Paid",
  refunded: "Refunded",
};

export const GENDERS = ["male", "female", "other"] as const;
export const OCCUPATIONS = [
  "Student",
  "Job Holder",
  "Job Seeker",
  "Entrepreneur",
  "Freelancer",
  "Other",
] as const;

/** Details captured in step 3 of the wizard (stored in appointments.details). */
export const bookingDetailsSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().trim().min(6, "Enter an active phone number.").max(40),
  whatsapp: z.string().trim().min(6, "Enter your WhatsApp number.").max(40),
  gender: z.enum(GENDERS),
  age: z.coerce.number().int().min(10, "Enter a valid age.").max(100),
  occupation: z.string().trim().min(2, "Select your occupation.").max(60),
  note: z.string().trim().max(1000).optional().default(""),
});
export type BookingDetails = z.infer<typeof bookingDetailsSchema>;

/** Full payload the "Review & Pay" step sends to create the appointment. */
export const createAppointmentSchema = z.object({
  type_id: z.string().uuid().nullable(),
  type_name: z.string().trim().max(120),
  topic: z.string().trim().max(200).optional().default(""),
  mentor_id: z.string().uuid("Choose a mentor."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  details: bookingDetailsSchema,
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/** Manual bKash payment submission for an appointment. */
export const appointmentPaymentSchema = z.object({
  appointment_id: z.string().uuid(),
  sender_number: z.string().trim().min(6, "Enter the bKash number you sent from.").max(20),
  transaction_id: z.string().trim().min(4, "Enter the bKash transaction ID."),
  paid_amount_bdt: z.coerce.number().positive("Enter the amount you paid."),
  screenshot_path: z.string().optional(),
});
export type AppointmentPaymentInput = z.infer<typeof appointmentPaymentSchema>;

/** Admin appointment-type editor. */
export const appointmentTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter a name.").max(120),
  description: z.string().trim().max(300).optional().default(""),
  icon: z.string().trim().max(40).default("compass"),
  default_price_bdt: z.coerce.number().min(0).default(0),
  default_duration: z.coerce.number().int().min(15).max(480).default(120),
  status: z.enum(["active", "inactive"]).default("active"),
  sort_order: z.coerce.number().int().min(0).default(0),
});
export type AppointmentTypeInput = z.infer<typeof appointmentTypeSchema>;
