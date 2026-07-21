import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

/** Cache tag busted by the admin save action so the FAB updates instantly. */
export const SITE_SETTINGS_TAG = "site-settings";

export type WhatsappConnection = "number" | "link";
export type WhatsappPosition = "bottom-right" | "bottom-left";
export type WhatsappSize = "sm" | "md" | "lg";

export type WhatsappSettings = {
  enabled: boolean;
  connection: WhatsappConnection;
  number: string;
  link: string;
  message: string;
  position: WhatsappPosition;
  size: WhatsappSize;
  animation: boolean;
};

export const WHATSAPP_DEFAULTS: WhatsappSettings = {
  enabled: false,
  connection: "number",
  number: "",
  link: "",
  message: "Hello! I want to know more about MCA.",
  position: "bottom-right",
  size: "md",
  animation: true,
};

/**
 * Reads the global site settings for the WhatsApp button. Uses the cookieless
 * public client so it never forces dynamic rendering, and is wrapped in
 * `unstable_cache` with a tag — the admin save action calls `revalidateTag`
 * so a change goes live everywhere without a redeploy.
 */
export const getWhatsappSettings = unstable_cache(
  async (): Promise<WhatsappSettings> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (!data) return WHATSAPP_DEFAULTS;

    return {
      enabled: data.whatsapp_enabled ?? false,
      connection:
        data.whatsapp_connection === "link" ? "link" : "number",
      number: data.whatsapp_number ?? "",
      link: data.whatsapp_link ?? "",
      message: data.whatsapp_message ?? WHATSAPP_DEFAULTS.message,
      position:
        data.whatsapp_position === "bottom-left" ? "bottom-left" : "bottom-right",
      size:
        data.whatsapp_size === "sm" || data.whatsapp_size === "lg"
          ? data.whatsapp_size
          : "md",
      animation: data.whatsapp_animation ?? true,
    };
  },
  ["whatsapp-settings"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 3600 },
);

/**
 * Builds the click-through URL. A `wa.me` link opens the WhatsApp app on mobile
 * and WhatsApp Web / desktop on a computer automatically, so a single href
 * satisfies both platforms. Returns null when nothing usable is configured.
 */
export function buildWhatsappHref(s: WhatsappSettings): string | null {
  if (s.connection === "link") {
    const link = s.link?.trim();
    return link ? link : null;
  }
  const digits = (s.number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  const msg = s.message?.trim();
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}
