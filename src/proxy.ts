import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Proxy (formerly `middleware`) — refreshes the Supabase session on every
 * request and guards protected areas:
 *   /dashboard/**  -> requires a logged-in user
 *   /mentor/**     -> requires a logged-in user (panel re-checks role)
 *   /checkout/**   -> requires a logged-in user
 *   /admin/**      -> requires profiles.role = 'admin'
 *
 * Pages must ALSO re-check auth/role server-side; the proxy is the first gate.
 */
function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname === "/mentor" ||
    pathname.startsWith("/mentor/") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin")
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail CLOSED: if env is misconfigured we cannot verify auth, so protected
  // routes must not be reachable. Public routes still render.
  if (!supabaseUrl || !supabaseKey) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname === "/mentor" ||
    pathname.startsWith("/mentor/") ||
    pathname.startsWith("/checkout");

  if (requiresAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
