"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailEnabled, escapeHtml } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";
import { SITE } from "@/lib/constants";
import { contactSchema, type ContactInput } from "@/features/contact/schemas";

export async function submitContact(
  input: ContactInput,
): Promise<{ error: string } | { success: true }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  // Throttle spam: at most 3 messages per minute per IP.
  if (!(await rateLimitByIp("contact", 3, 60_000))) {
    return { error: "You're sending messages too quickly. Please wait a moment." };
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

  // Optional: notify the team via Resend if configured. Never block on it —
  // the message is already safely stored for admin review above.
  if (emailEnabled()) {
    const to = process.env.CONTACT_NOTIFICATION_TO || SITE.email;
    void sendEmail({
      to,
      replyTo: parsed.data.email,
      subject: `New contact message: ${parsed.data.subject}`,
      html:
        `<p><strong>From:</strong> ${escapeHtml(parsed.data.name)} ` +
        `(${escapeHtml(parsed.data.email)})</p>` +
        `<p><strong>Subject:</strong> ${escapeHtml(parsed.data.subject)}</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>`,
    });
  }

  return { success: true };
}
