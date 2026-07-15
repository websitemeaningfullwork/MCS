"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  User,
  UserRound,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { NavSearch } from "@/components/shared/nav-search";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LangToggle } from "@/components/shared/lang-toggle";
import { useDict } from "@/components/shared/language-provider";
import { CategoryIcon } from "@/components/marketing/category-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/browser";
import { NAV_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const dict = useDict();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Auth state is fetched client-side (a small dynamic "island") so the root
  // layout — and therefore public marketing pages — stay static/cacheable
  // instead of being forced dynamic by a server-side session read.
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const homeForRole =
    role === "admin" ? "/admin" : role === "mentor" ? "/mentor" : "/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setAuthed(Boolean(user));
      if (!user) {
        setRole(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (active) setRole(profile?.role ?? null);
    }

    loadAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadAuth());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const primaryLinks = [
    { href: "/mentors", label: dict.nav.mentors },
    { href: "/resources", label: dict.nav.ebooks },
    { href: "/live-classes", label: dict.nav.liveClasses },
  ];

  const allLinks = [
    { href: "/", label: dict.nav.home },
    { href: "/programs", label: dict.nav.programs },
    { href: "/mentors", label: dict.nav.mentors },
    { href: "/resources", label: dict.nav.ebooks },
    { href: "/live-classes", label: dict.nav.liveClasses },
    { href: "/mock-tests", label: dict.nav.mockTests },
    { href: "/community", label: dict.nav.community },
    { href: "/blog", label: dict.nav.blog },
    { href: "/about", label: dict.nav.about },
    { href: "/contact", label: dict.nav.contact },
  ];

  const linkClass = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      active
        ? "bg-secondary text-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
    );

  return (
    <header className="fixed inset-x-0 top-5 z-50 px-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300">
      <nav
        aria-label="Primary"
        className={cn(
          "glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[1.75rem] px-4 py-3 transition-shadow duration-300 sm:px-6",
          scrolled && "shadow-card",
        )}
      >
        <Logo priority />

        {/* Desktop links */}
        <div className="hidden items-center gap-0.5 lg:flex">
          <Link
            href="/"
            aria-current={isActive("/") ? "page" : undefined}
            className={linkClass(isActive("/"))}
          >
            {dict.nav.home}
          </Link>

          {/* Programs dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1",
                linkClass(isActive("/programs")),
              )}
            >
              {dict.nav.programs}
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[440px] p-3">
              <div className="grid grid-cols-2 gap-1">
                {NAV_CATEGORIES.map((cat) => (
                  <DropdownMenuItem key={cat.slug} asChild>
                    <Link
                      href={`/programs?category=${cat.slug}`}
                      className="flex items-center gap-2.5"
                    >
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CategoryIcon name={cat.icon} className="size-4" />
                      </span>
                      <span className="text-sm">{cat.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-1">
                <Link
                  href="/programs"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all programs →
                </Link>
                <Link
                  href="/mock-tests"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Mock Tests
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={linkClass(isActive(link.href))}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <NavSearch label={dict.nav.search} />

          <div className="hidden md:block">
            <LangToggle />
          </div>

          <ThemeToggle />

          {/* Notifications */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="hidden rounded-full sm:inline-flex"
          >
            <Link href={authed ? "/dashboard" : "/login"}>
              <Bell className="size-5" />
            </Link>
          </Button>

          {/* Auth-aware profile / login */}
          {authed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Account menu"
                  className="rounded-full"
                >
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === "admin" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="size-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {role === "mentor" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/mentor">
                      <UserRound className="size-4" />
                      Mentor Panel
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    {dict.nav.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
              <Link href="/login">
                <User className="size-4" />
                {dict.nav.login}
              </Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <ul className="mt-2 flex flex-col gap-1 px-4">
                {allLinks.map((link) => (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <Link
                        href={link.href}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-base font-medium transition-colors",
                          isActive(link.href)
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border px-4 pt-4">
                <LangToggle />
                <SheetClose asChild>
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={authed ? homeForRole : "/login"}>
                      <User className="size-4" />
                      {authed ? dict.nav.dashboard : dict.nav.login}
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
