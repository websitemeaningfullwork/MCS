"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SITE_SETTINGS_TAG } from "@/lib/site-settings";

/** Returns { supabase, userId } for an admin caller, or null otherwise. */
async function getAdminContext() {
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
  return profile?.role === "admin" ? { supabase, userId: user.id } : null;
}

const whatsappSchema = z
  .object({
    whatsapp_enabled: z.boolean(),
    whatsapp_connection: z.enum(["number", "link"]),
    whatsapp_number: z.string().trim().optional().default(""),
    whatsapp_link: z.string().trim().optional().default(""),
    whatsapp_message: z.string().trim().max(500).optional().default(""),
    whatsapp_position: z.enum(["bottom-right", "bottom-left"]),
    whatsapp_size: z.enum(["sm", "md", "lg"]),
    whatsapp_animation: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (!val.whatsapp_enabled) return; // nothing required while disabled
    if (val.whatsapp_connection === "number") {
      const digits = val.whatsapp_number.replace(/\D/g, "");
      if (digits.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp_number"],
          message: "Enter a valid WhatsApp number.",
        });
      }
    } else {
      if (!/^https?:\/\/.+/i.test(val.whatsapp_link)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp_link"],
          message: "Enter a valid WhatsApp link (https://…).",
        });
      }
    }
  });

export type WhatsappSettingsInput = z.input<typeof whatsappSchema>;

export async function saveWhatsappSettings(
  input: WhatsappSettingsInput,
): Promise<{ error?: string }> {
  const parsed = whatsappSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const ctx = await getAdminContext();
  if (!ctx) return { error: "Not authorized." };

  const d = parsed.data;
  const { error } = await ctx.supabase.from("site_settings").upsert(
    {
      id: "global",
      whatsapp_enabled: d.whatsapp_enabled,
      whatsapp_connection: d.whatsapp_connection,
      whatsapp_number: d.whatsapp_number || null,
      whatsapp_link: d.whatsapp_link || null,
      whatsapp_message: d.whatsapp_message || null,
      whatsapp_position: d.whatsapp_position,
      whatsapp_size: d.whatsapp_size,
      whatsapp_animation: d.whatsapp_animation,
      updated_at: new Date().toISOString(),
      updated_by: ctx.userId,
    },
    { onConflict: "id" },
  );
  if (error) return { error: "Could not save settings." };

  // Bust the FAB's cached read + refresh every route's layout so the button
  // reflects the change with no redeploy. ("max" = stale-while-revalidate; the
  // single-arg form is deprecated in Next 16.)
  revalidateTag(SITE_SETTINGS_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return {};
}
