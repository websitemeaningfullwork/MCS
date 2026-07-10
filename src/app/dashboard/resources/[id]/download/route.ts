import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Secure download: verifies the user owns the resource (or is admin), then
 * issues a short-lived signed URL for the private file and redirects to it.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/dashboard/resources", req.url));
  }

  // Access check: owned resource or admin.
  const [{ data: access }, { data: profile }] = await Promise.all([
    supabase
      .from("resource_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("resource_id", id)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  const isAdmin = profile?.role === "admin";
  if (!access && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard/resources", req.url));
  }

  // Read the file path with the service-role client: migration 006 dropped the
  // public read policy on the `resources` base table, so a legitimately-entitled
  // non-admin student would otherwise get zero rows here (fail-closed) and never
  // reach their paid download. Ownership was already verified above.
  const admin = createAdminClient();
  const { data: resource } = await admin
    .from("resources")
    .select("file_storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!resource?.file_storage_path) {
    return NextResponse.redirect(new URL("/dashboard/resources", req.url));
  }

  const { data: signed } = await admin.storage
    .from("resource-files")
    .createSignedUrl(resource.file_storage_path, 60 * 5);
  if (!signed?.signedUrl) {
    return NextResponse.redirect(new URL("/dashboard/resources", req.url));
  }

  return NextResponse.redirect(signed.signedUrl);
}
