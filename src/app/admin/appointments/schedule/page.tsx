import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin-guard";
import { ApptTabs } from "@/components/admin/appointments/appt-tabs";
import {
  MentorScheduleEditor,
  type ScheduleMentor,
} from "@/components/admin/appointments/mentor-schedule-editor";
import type { MentorAvailability } from "@/features/appointments/slots";

export const metadata: Metadata = { title: "Mentor Schedule — Admin" };

export default async function AdminMentorSchedulePage() {
  const { supabase } = await requireAdmin();

  const { data: mentorRows } = await supabase
    .from("mentors")
    .select("id, availability, session_duration")
    .order("sort_order", { ascending: true });
  const ids = (mentorRows ?? []).map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const mentors: ScheduleMentor[] = (mentorRows ?? []).map((m) => ({
    id: m.id,
    name: nameById.get(m.id) ?? "Mentor",
    availability: (m.availability ?? {}) as unknown as MentorAvailability,
    session_duration: m.session_duration,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
      <ApptTabs />
      {mentors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No mentors yet. Add mentors first under Admin → Mentors.
        </p>
      ) : (
        <MentorScheduleEditor mentors={mentors} />
      )}
    </div>
  );
}
