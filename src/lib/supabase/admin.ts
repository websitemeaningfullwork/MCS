import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * SERVER-ONLY. Never import this into a "use client" file. It is guarded three
 * ways: the `server-only` import (build-time), a runtime window check, and the
 * fact that the service-role key is never exposed with a NEXT_PUBLIC_ prefix.
 *
 * Use ONLY inside admin/privileged Server Actions after verifying the caller is
 * an admin (or a system flow such as approving a payment).
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must never run in the browser.");
  }

  return createSupabaseClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
