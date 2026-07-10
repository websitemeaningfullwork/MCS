import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/**
 * Cookieless Supabase client for **public, anon-readable** data only.
 *
 * Unlike `@/lib/supabase/server`, this never touches `cookies()`, so a page
 * that reads exclusively through it is NOT forced into dynamic rendering — it
 * can be statically prerendered and revalidated (ISR) and served from the CDN.
 * RLS still applies; only data an anonymous visitor may read comes back. Never
 * use this for anything that depends on the signed-in user.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
