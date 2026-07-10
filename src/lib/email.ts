import "server-only";

/**
 * Minimal Resend wrapper. Email is an OPTIONAL, best-effort side channel:
 * everything still works (and is stored in the DB) when Resend is not
 * configured. Callers must never block or fail on the result.
 *
 * Uses the REST API directly via fetch so we don't pull in an SDK dependency.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

/** True when Resend is configured (API key + a from address are present). */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

/**
 * Send an email if Resend is configured. Returns `true` on success, `false`
 * otherwise. Never throws — failures are logged server-side only.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return false;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend send threw:", err);
    return false;
  }
}

/** Escape user-supplied text for safe interpolation into an HTML email body. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
