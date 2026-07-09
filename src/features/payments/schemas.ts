import { z } from "zod";

export const manualPaymentSchema = z.object({
  type: z.enum(["program", "resource"]),
  id: z.string().uuid(),
  sender_number: z
    .string()
    .min(6, "Enter the bKash number you sent from.")
    .max(20),
  transaction_id: z.string().min(4, "Enter the bKash transaction ID."),
  paid_amount_bdt: z.coerce
    .number()
    .positive("Enter the amount you paid."),
  screenshot_path: z.string().optional(),
});

export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;
