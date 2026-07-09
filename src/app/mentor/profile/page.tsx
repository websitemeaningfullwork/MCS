import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { requireMentor } from "@/lib/mentor-guard";
import { MentorProfileForm } from "@/components/mentor/mentor-profile-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Profile" };

export default async function MentorProfilePage() {
  const { user, supabase } = await requireMentor();

  const [{ data: profile }, { data: mentor }] = await Promise.all([
    supabase.from("profiles").select("full_name, bio").eq("id", user.id).maybeSingle(),
    supabase.from("mentors").select("*").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Profile
        </h1>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/mentors/${user.id}`}>
            <ExternalLink className="size-4" />
            View public profile
          </Link>
        </Button>
      </div>

      <MentorProfileForm
        initial={{
          full_name: profile?.full_name ?? "",
          bio: profile?.bio ?? "",
          headline: mentor?.headline ?? "",
          expertise: mentor?.expertise ?? [],
          skills: mentor?.skills ?? [],
          whatsapp: mentor?.whatsapp ?? "",
          linkedin_url: mentor?.linkedin_url ?? "",
        }}
      />
    </div>
  );
}
