"use client";

import Link from "next/link";
import { useEffect, useState, type SVGProps } from "react";
import { ArrowUp, Users } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { useLanguage } from "@/components/shared/language-provider";
import { FOOTER_METRICS, SITE } from "@/lib/constants";
import { localize, type Bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* Brand/social glyphs — lucide dropped brand icons, so we inline them. */
function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
    </svg>
  );
}
function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}
function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const columns: {
  key: "company" | "learn" | "resources" | "legal";
  links: { href: string; label: Bi }[];
}[] = [
  {
    key: "company",
    links: [
      { href: "/about", label: { en: "About", bn: "আমাদের সম্পর্কে" } },
      { href: "/mentors", label: { en: "Mentors", bn: "মেন্টর" } },
      { href: "/blog", label: { en: "Blog", bn: "ব্লগ" } },
      { href: "/contact", label: { en: "Contact", bn: "যোগাযোগ" } },
    ],
  },
  {
    key: "learn",
    links: [
      { href: "/programs", label: { en: "Programs", bn: "প্রোগ্রাম" } },
      { href: "/live-classes", label: { en: "Live Classes", bn: "লাইভ ক্লাস" } },
      { href: "/mock-tests", label: { en: "Mock Tests", bn: "মক টেস্ট" } },
      { href: "/community", label: { en: "Community", bn: "কমিউনিটি" } },
    ],
  },
  {
    key: "resources",
    links: [
      { href: "/resources", label: { en: "E-books", bn: "ই-বুক" } },
      {
        href: "/resources?kind=cv_template",
        label: { en: "CV Templates", bn: "সিভি টেমপ্লেট" },
      },
      {
        href: "/resources?kind=roadmap",
        label: { en: "Career Roadmaps", bn: "ক্যারিয়ার রোডম্যাপ" },
      },
      {
        href: "/resources?kind=interview",
        label: { en: "Interview Prep", bn: "ইন্টারভিউ প্রস্তুতি" },
      },
    ],
  },
  {
    key: "legal",
    links: [
      { href: "/terms", label: { en: "Terms", bn: "শর্তাবলী" } },
      { href: "/privacy", label: { en: "Privacy", bn: "প্রাইভেসি পলিসি" } },
      { href: "/refund", label: { en: "Refund Policy", bn: "রিফান্ড পলিসি" } },
    ],
  },
];

/* Brand-colored gradient chips (network identity colors, matching the
   reference design); the rest of the footer stays on the blue theme. */
const socials = [
  {
    href: "https://facebook.com",
    label: "Facebook",
    Icon: FacebookIcon,
    gradient: "bg-gradient-to-br from-[#2468a9] to-[#4267B2]",
  },
  {
    href: "https://youtube.com",
    label: "YouTube",
    Icon: YoutubeIcon,
    gradient: "bg-gradient-to-br from-[#e4194c] to-[#ff6b6b]",
  },
  {
    href: "https://linkedin.com",
    label: "LinkedIn",
    Icon: LinkedinIcon,
    gradient: "bg-gradient-to-br from-[#0077b5] to-[#00a0dc]",
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
    Icon: InstagramIcon,
    gradient: "bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
  },
];

/* Scroll-to-top FAB — appears after scrolling, pops in, sits above the
   WhatsApp button so the two never overlap. */
function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="anim-bounce-in fixed bottom-24 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_6px_20px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)] sm:bottom-28 sm:right-8"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

export function Footer() {
  const { dict, lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="glass-footer relative mt-24 border-t-[3px] border-primary">
      {/* Animated shimmer hairline along the top edge. */}
      <div aria-hidden className="shimmer-line absolute inset-x-0 top-0 h-px" />
      <ScrollTopButton />
      <div className="mx-auto max-w-6xl px-4 py-14">
        {/* Social-proof metric strip. */}
        <div className="grid grid-cols-2 gap-6 border-b border-border pb-10 sm:grid-cols-4">
          {FOOTER_METRICS.map((m) => (
            <div key={m.label.en}>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {m.value}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {localize(lang, m.label)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {dict.footer.tagline}
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-3 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {SITE.email}
            </a>
          </div>

          {columns.map((col) => (
            <nav
              key={col.key}
              aria-label={dict.footer[col.key]}
              className="group/col transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Column heading with a gradient underline that grows on hover. */}
              <h2 className="relative inline-block pb-2 text-sm font-bold uppercase tracking-wide text-foreground after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-8 after:rounded-full after:bg-gradient-to-r after:from-blue-600 after:to-sky-500 after:transition-all after:duration-300 group-hover/col:after:w-14">
                {dict.footer[col.key]}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group/link relative inline-block py-0.5 text-sm text-muted-foreground transition-all duration-300 hover:translate-x-2 hover:font-medium hover:text-primary"
                    >
                      <span
                        aria-hidden
                        className="absolute -left-3 top-1/2 h-0.5 w-0 -translate-y-1/2 rounded-full bg-primary transition-all duration-300 group-hover/link:w-2"
                      />
                      {localize(lang, link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {year} MCA — Meaningful Career Academy. {dict.footer.rights}
            </p>
            {/* Pulsing community badge (reference-style stats pill). */}
            <span className="anim-pulse-soft mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
              <Users className="size-3.5" />
              {FOOTER_METRICS[0].value} {localize(lang, FOOTER_METRICS[0].label)}
            </span>
          </div>

          {/* Brand-gradient social chips with shine sweep + tooltip. */}
          <div className="flex items-center gap-3">
            {socials.map(({ href, label, Icon, gradient }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={cn(
                  "shine-sweep group/social relative flex size-11 items-center justify-center rounded-full text-white shadow-[0_4px_15px_rgba(15,23,42,0.15)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_8px_25px_rgba(15,23,42,0.25)]",
                  gradient,
                )}
              >
                <Icon className="size-5" />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[130%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg transition-all duration-300 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900 group-hover/social:bottom-[120%] group-hover/social:opacity-100"
                >
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
