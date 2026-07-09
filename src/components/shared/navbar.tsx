"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, Search, User } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LangToggle } from "@/components/shared/lang-toggle";
import { useDict } from "@/components/shared/language-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { easeApple } from "@/lib/motion";
import { cn } from "@/lib/utils";

function useNavLinks() {
  const dict = useDict();
  return [
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
}

export function Navbar() {
  const dict = useDict();
  const pathname = usePathname();
  const links = useNavLinks();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeApple }}
      className="fixed inset-x-0 top-4 z-50 px-4"
    >
      <nav
        className={cn(
          "glass mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 py-2 transition-shadow duration-300 sm:px-4",
          scrolled && "shadow-card",
        )}
        aria-label="Primary"
      >
        <Logo />

        {/* Desktop links */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right-side controls */}
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={dict.nav.search}
            className="hidden sm:inline-flex"
          >
            <Link href="/programs">
              <Search className="size-5" />
            </Link>
          </Button>

          <div className="hidden md:block">
            <LangToggle />
          </div>

          <ThemeToggle />

          <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
            <Link href="/login">
              <User className="size-4" />
              {dict.nav.login}
            </Link>
          </Button>

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
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <ul className="mt-2 flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <Link
                        href={link.href}
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
                    <Link href="/login">
                      <User className="size-4" />
                      {dict.nav.login}
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
