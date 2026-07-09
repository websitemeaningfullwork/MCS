import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** Supabase client for Client Components. Uses the public anon key (RLS applies). */
export function createClient() {
  return createBrowserClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  );
}
