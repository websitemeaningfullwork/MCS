"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
  return profile?.role === "admin" ? supabase : null;
}

const settingsSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  bkash_number: z.string().min(6, "Enter a valid bKash number."),
  instructions: z.string().optional(),
  is_active: z.boolean(),
});

export type PaymentSettingsInput = z.infer<typeof settingsSchema>;

export async function savePaymentSettings(
  input: PaymentSettingsInput,
): Promise<{ error?: string }> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const row = {
    label: parsed.data.label,
    bkash_number: parsed.data.bkash_number,
    instructions: parsed.data.instructions ?? null,
    is_active: parsed.data.is_active,
    updated_at: new Date().toISOString(),
  };

  const { error } = parsed.data.id
    ? await supabase.from("payment_settings").update(row).eq("id", parsed.data.id)
    : await supabase.from("payment_settings").insert(row);
  if (error) return { error: "Could not save settings." };

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return {};
}
