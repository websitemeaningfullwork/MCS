"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

/**
 * Admin gate. Returns the caller's own id too: role changes need to know WHO is
 * asking so an admin can't demote themselves out of the admin console.
 */
async function assertAdmin() {
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
  return profile?.role === "admin" ? { supabase, callerId: user.id } : null;
}

export async function setUserRole(
  userId: string,
  role: Enums<"user_role">,
): Promise<{ error?: string }> {
  const ctx = await assertAdmin();
  if (!ctx) return { error: "Not authorized." };
  const { supabase, callerId } = ctx;

  // Read the CURRENT role first: the lock-out guards below only matter when this
  // change removes an existing admin.
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { error: "That user could not be found." };
  if (target.role === role) return {}; // nothing to do

  const demotingAnAdmin = target.role === "admin" && role !== "admin";

  if (demotingAnAdmin) {
    // Admin is only grantable from this screen, so an accidental self-demotion
    // locks the person out of the very page that could undo it — recovery means
    // hand-editing profiles in the Supabase dashboard.
    if (userId === callerId) {
      return {
        error:
          "You can't remove your own admin access. Ask another admin to change your role.",
      };
    }

    // ...and the last admin standing must stay, or NOBODY can reach /admin.
    // count + head:true is a cheap COUNT(*) — no rows come back over the wire.
    const { count, error: countErr } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) {
      console.error("setUserRole: admin count failed", countErr);
      return { error: "Could not verify the remaining admins. Please try again." };
    }
    // NOTE (TOCTOU): two admins demoting each other in the same instant could
    // both pass this check and empty the admin set. The window is milliseconds
    // wide on a screen only admins can reach, so a friendly guard beats a
    // transaction/advisory lock here; a DB-level trigger would be the real fix.
    if ((count ?? 0) <= 1) {
      return {
        error:
          "This is the only admin left. Promote another user to admin first, then change this role.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    console.error("setUserRole: role update failed", error);
    return { error: "Could not change the role." };
  }

  // Ensure a mentors row exists when promoting to mentor.
  if (role === "mentor") {
    const { error: mentorErr } = await supabase
      .from("mentors")
      .upsert({ id: userId }, { onConflict: "id" });
    if (mentorErr) {
      console.error("setUserRole: mentor upsert failed", mentorErr);
      return { error: "Role changed, but the mentor record could not be created." };
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/mentors");
  return {};
}

export async function setMentorVerified(
  userId: string,
  verified: boolean,
): Promise<{ error?: string }> {
  const ctx = await assertAdmin();
  if (!ctx) return { error: "Not authorized." };
  const { supabase } = ctx;

  // This used to upsert blindly, so verifying a student or an admin CREATED a
  // stray mentors row for them — which then shows up on /mentors as a verified
  // mentor with no profile behind it. Guard on the profile role instead.
  //
  // We still allow the write when a mentors row already exists: someone demoted
  // back to student keeps their row, and an admin must be able to UN-verify them.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "mentor") {
    const { data: existingMentor } = await supabase
      .from("mentors")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!existingMentor) {
      return { error: "Set this user's role to mentor before verifying them." };
    }
  }

  const { error } = await supabase.from("mentors").upsert(
    { id: userId, is_verified: verified },
    { onConflict: "id" },
  );
  if (error) {
    console.error("setMentorVerified: upsert failed", error);
    return { error: "Could not update verification status." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/mentors");
  return {};
}
