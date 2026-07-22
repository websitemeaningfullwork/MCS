import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-guard";
import { MentorForm } from "@/components/admin/mentor-form";
import {
  DEFAULT_AVAILABILITY,
  type Availability,
  type MentorStatus,
} from "@/features/admin/mentor-schema";

export const metadata: Metadata = { title: "Edit mentor" };

function toAvailability(raw: unknown): Availability {
  if (!raw || typeof raw !== "object") return DEFAULT_AVAILABILITY;
  const a = raw as Record<string, unknown>;
  const days = Array.isArray(a.working_days) ? (a.working_days as Availability["working_days"]) : null;
  if (!days) return DEFAULT_AVAILABILITY;
  return {
    working_days: days,
    start_time: typeof a.start_time === "string" ? a.start_time : "09:00",
    end_time: typeof a.end_time === "string" ? a.end_time : "17:00",
    breaks: Array.isArray(a.breaks)
      ? (a.breaks as { start: string; end: string }[]).filter(
          (b) => b && typeof b.start === "string" && typeof b.end === "string",
        )
      : [],
  };
}

export default async function EditMentorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: mentor }, { data: profile }] = await Promise.all([
    supabase.from("mentors").select("*").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("full_name, bio, avatar_url").eq("id", id).maybeSingle(),
  ]);
  if (!mentor) notFound();

  return (
    <MentorForm
      initial={{
        id,
        full_name: profile?.full_name ?? "",
        headline: mentor.headline ?? "",
        bio: profile?.bio ?? "",
        avatar_url: profile?.avatar_url ?? null,
        phone: mentor.phone ?? "",
        whatsapp: mentor.whatsapp ?? "",
        email: mentor.email ?? "",
        show_phone: mentor.show_phone ?? true,
        show_whatsapp: mentor.show_whatsapp ?? true,
        show_email: mentor.show_email ?? false,
        expertise: mentor.expertise ?? [],
        skills: mentor.skills ?? [],
        years_experience: mentor.years_experience ?? 0,
        highest_qualification: mentor.highest_qualification ?? "",
        current_position: mentor.current_position ?? "",
        organization: mentor.organization ?? "",
        availability: toAvailability(mentor.availability),
        session_duration: mentor.session_duration ?? 60,
        session_price_bdt: mentor.session_price_bdt ?? 0,
        currency: mentor.currency ?? "BDT",
        facebook_url: mentor.facebook_url ?? "",
        youtube_url: mentor.youtube_url ?? "",
        linkedin_url: mentor.linkedin_url ?? "",
        is_featured: mentor.is_featured ?? false,
        is_verified: mentor.is_verified ?? false,
        is_active: mentor.is_active ?? true,
        sort_order: mentor.sort_order ?? 0,
        status: (mentor.status ?? "active") as MentorStatus,
      }}
    />
  );
}
