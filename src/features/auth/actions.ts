"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site-url";
import { rateLimitByIp } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
} from "@/features/auth/schemas";

type ActionError = { error: string };

export async function signInWithEmail(
  input: LoginInput,
): Promise<ActionError | { success: true }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your email and password." };
  }

  // Slow down credential-stuffing / brute force: 10 attempts per minute per IP.
  if (!(await rateLimitByIp("login", 10, 60_000))) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Generic message to avoid account enumeration; log the real cause server-side.
    console.error("signInWithEmail error:", error.message);
    return { error: "Invalid email or password." };
  }
  return { success: true };
}

export async function signUpWithEmail(
  input: RegisterInput,
): Promise<ActionError | { success: true; needsConfirmation: boolean }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  // Limit automated sign-up abuse: 5 accounts per minute per IP.
  if (!(await rateLimitByIp("signup", 5, 60_000))) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // role always defaults to 'student' via the DB trigger; never trusted from the client.
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: absoluteUrl("/auth/callback"),
    },
  });

  if (error) {
    console.error("signUpWithEmail error:", error.message);
    return { error: "Could not create your account. Please try again." };
  }
  return { success: true, needsConfirmation: !data.session };
}

export async function signInWithGoogle(): Promise<ActionError | { url: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: absoluteUrl("/auth/callback") },
  });

  if (error) return { error: error.message };
  if (!data.url) return { error: "Could not start Google sign-in." };
  return { url: data.url };
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<ActionError | { success: true }> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  // Throttle reset-email requests: 5 per minute per IP.
  if (!(await rateLimitByIp("password-reset", 5, 60_000))) {
    return { error: "Too many requests. Please wait a minute and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: absoluteUrl("/auth/callback?next=/reset-password") },
  );

  // Always report success to avoid revealing whether an account exists.
  if (error) console.error("requestPasswordReset error:", error.message);
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
