"use server";

import { createClient } from "@/lib/supabase/server";
import { contactSchema, type ContactInput } from "@/features/contact/schemas";

export async function submitContact(
  input: ContactInput,
): Promise<{ error: string } | { success: true }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    body: parsed.data.message,
  });

  if (error) {
    return { error: "Something went wrong. Please try again." };
  }

  // Optional: send an email via Resend if configured. Never block on it.
  // (Resend is not wired in the MVP; the message is stored for admin review.)

  return { success: true };
}
