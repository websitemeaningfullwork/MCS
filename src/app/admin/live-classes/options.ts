import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type Option = { id: string; label: string };

/**
 * Mentor + program options for the live-class form. Mentor display names come
 * from the safe `public_mentor_profiles` view; programs from their titles.
 */
export async function loadLiveClassOptions(
  supabase: ServerClient,
): Promise<{ mentors: Option[]; programs: Option[] }> {
  const [{ data: mentorRows }, { data: profileRows }, { data: programRows }] =
    await Promise.all([
      supabase.from("mentors").select("id, headline"),
      supabase.from("public_mentor_profiles").select("id, full_name"),
      supabase.from("programs").select("id, title").order("title"),
    ]);

  const nameById = new Map((profileRows ?? []).map((p) => [p.id, p.full_name]));
  const mentors: Option[] = (mentorRows ?? []).map((m) => ({
    id: m.id,
    label: nameById.get(m.id) || m.headline || m.id,
  }));
  const programs: Option[] = (programRows ?? []).map((p) => ({
    id: p.id,
    label: p.title,
  }));

  return { mentors, programs };
}
