/**
 * Light-touch bilingual dictionary (EN + বাংলা).
 * MVP only: no next-intl runtime. The active language lives in a client
 * context (see components/shared/language-provider.tsx) + localStorage.
 * Content starts in English; Bangla keys are ready to fill in.
 */

export type Lang = "en" | "bn";

export const LANGS: Lang[] = ["en", "bn"];
export const DEFAULT_LANG: Lang = "en";

/**
 * A bilingual string pair. Server-rendered copy (homepage sections, constants)
 * stores both languages and the client picks one — either through the `<T>`
 * leaf component (`components/shared/t.tsx`, for JSX text) or `localize()`
 * (for attribute strings inside client components). This keeps statically
 * rendered pages cacheable while still switching language instantly.
 */
export type Bi = { en: string; bn: string };

/** Resolve a bilingual pair for the active language. */
export function localize(lang: Lang, text: Bi): string {
  return lang === "bn" ? text.bn : text.en;
}

/**
 * Resolve a value that may be a plain string (e.g. user content from the DB,
 * which is never machine-translated) or a bilingual pair.
 */
export function localizeAny(lang: Lang, text: string | Bi): string {
  return typeof text === "string" ? text : localize(lang, text);
}

/** The dictionary shape — string values so EN and BN stay type-compatible. */
export interface Dict {
  nav: {
    home: string;
    programs: string;
    mentors: string;
    ebooks: string;
    liveClasses: string;
    appointments: string;
    mockTests: string;
    community: string;
    blog: string;
    about: string;
    contact: string;
    search: string;
    login: string;
    dashboard: string;
    categories: string;
    highlights: string;
    viewAllPrograms: string;
    newHere: string;
    newHereDesc: string;
    quickEnroll: string;
    myAccount: string;
    adminPanel: string;
    mentorPanel: string;
    settings: string;
    signOut: string;
  };
  common: {
    findMentor: string;
    explorePrograms: string;
    getStarted: string;
    learnMore: string;
    viewAll: string;
    loading: string;
    free: string;
  };
  footer: {
    company: string;
    learn: string;
    resources: string;
    legal: string;
    tagline: string;
    rights: string;
  };
  notifications: {
    title: string;
    markAllRead: string;
    empty: string;
    unread: string;
  };
}

export const dictionaries: Record<Lang, Dict> = {
  en: {
    nav: {
      home: "Home",
      programs: "Programs",
      mentors: "Mentors",
      ebooks: "E-books",
      liveClasses: "Live Classes",
      appointments: "Appointments",
      mockTests: "Mock Tests",
      community: "Community",
      blog: "Blog",
      about: "About",
      contact: "Contact",
      search: "Search",
      login: "Log in",
      dashboard: "Dashboard",
      categories: "Categories",
      highlights: "Highlights",
      viewAllPrograms: "View all programs",
      newHere: "New here?",
      newHereDesc: "Find a mentor and enroll in minutes.",
      quickEnroll: "Quick enroll",
      myAccount: "My account",
      adminPanel: "Admin Panel",
      mentorPanel: "Mentor Panel",
      settings: "Settings",
      signOut: "Sign out",
    },
    common: {
      findMentor: "Find Your Mentor",
      explorePrograms: "Explore Programs",
      getStarted: "Get Started",
      learnMore: "Learn more",
      viewAll: "View all",
      loading: "Loading…",
      free: "Free",
    },
    footer: {
      company: "Company",
      learn: "Learn",
      resources: "Resources",
      legal: "Legal",
      tagline: "Guidance, not just courses.",
      rights: "All rights reserved.",
    },
    notifications: {
      title: "Notifications",
      markAllRead: "Mark all as read",
      empty: "No notifications yet.",
      unread: "unread",
    },
  },
  bn: {
    nav: {
      home: "হোম",
      programs: "প্রোগ্রাম",
      mentors: "মেন্টর",
      ebooks: "ই-বুক",
      liveClasses: "লাইভ ক্লাস",
      appointments: "অ্যাপয়েন্টমেন্ট",
      mockTests: "মক টেস্ট",
      community: "কমিউনিটি",
      blog: "ব্লগ",
      about: "আমাদের সম্পর্কে",
      contact: "যোগাযোগ",
      search: "খুঁজুন",
      login: "লগ ইন",
      dashboard: "ড্যাশবোর্ড",
      categories: "ক্যাটাগরি",
      highlights: "হাইলাইটস",
      viewAllPrograms: "সব প্রোগ্রাম দেখুন",
      newHere: "নতুন এসেছেন?",
      newHereDesc: "মেন্টর খুঁজে নিন, মিনিটেই এনরোল করুন।",
      quickEnroll: "দ্রুত এনরোল",
      myAccount: "আমার অ্যাকাউন্ট",
      adminPanel: "অ্যাডমিন প্যানেল",
      mentorPanel: "মেন্টর প্যানেল",
      settings: "সেটিংস",
      signOut: "সাইন আউট",
    },
    common: {
      findMentor: "আপনার মেন্টর খুঁজুন",
      explorePrograms: "প্রোগ্রাম দেখুন",
      getStarted: "শুরু করুন",
      learnMore: "আরও জানুন",
      viewAll: "সব দেখুন",
      loading: "লোড হচ্ছে…",
      free: "ফ্রি",
    },
    footer: {
      company: "কোম্পানি",
      learn: "শিখুন",
      resources: "রিসোর্স",
      legal: "লিগ্যাল",
      tagline: "শুধু কোর্স নয়, দিকনির্দেশনা।",
      rights: "সর্বস্বত্ব সংরক্ষিত।",
    },
    notifications: {
      title: "নোটিফিকেশন",
      markAllRead: "সব পঠিত চিহ্নিত করুন",
      empty: "এখনও কোনো নোটিফিকেশন নেই।",
      unread: "অপঠিত",
    },
  },
};

export function getDict(lang: Lang): Dict {
  return dictionaries[lang];
}
