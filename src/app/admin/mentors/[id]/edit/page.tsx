import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { MentorForm } from "@/components/admin/mentor-form";

export const metadata: Metadata = { title: "Edit mentor" };

export default async function EditMentorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: mentor }, { data: profile }] = await Promise.all([
    supabase.from("mentors").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, bio")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (!mentor) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mentors"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to mentors
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Edit mentor
      </h1>
      <MentorForm
        initial={{
          id,
          full_name: profile?.full_name ?? "",
          bio: profile?.bio ?? "",
          headline: mentor.headline ?? "",
          expertise: mentor.expertise ?? [],
          skills: mentor.skills ?? [],
          years_experience: mentor.years_experience ?? 0,
          whatsapp: mentor.whatsapp ?? "",
          linkedin_url: mentor.linkedin_url ?? "",
          is_featured: mentor.is_featured ?? false,
          is_verified: mentor.is_verified ?? false,
        }}
      />
    </div>
  );
}
