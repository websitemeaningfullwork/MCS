import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side gate for the mentor panel. Mentors and admins may enter.
 * Returns the session + profile + supabase client.
 */
export async function requireMentor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mentor");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "mentor" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  return { user, profile, supabase };
}
