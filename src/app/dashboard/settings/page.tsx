import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url, email")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <SettingsForm
        userId={user!.id}
        initialName={profile?.full_name ?? ""}
        initialBio={profile?.bio ?? ""}
        initialAvatar={profile?.avatar_url ?? null}
        email={profile?.email ?? user!.email ?? ""}
      />
    </div>
  );
}
