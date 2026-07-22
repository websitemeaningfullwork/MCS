/**
 * Light-touch bilingual dictionary (EN + বাংলা).
 * MVP only: no next-intl runtime. The active language lives in a client
 * context (see components/shared/language-provider.tsx) + localStorage.
 * Content starts in English; Bangla keys are ready to fill in.
 */

export type Lang = "en" | "bn";

export const LANGS: Lang[] = ["en", "bn"];
export const DEFAULT_LANG: Lang = "en";

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
  },
};

export function getDict(lang: Lang): Dict {
  return dictionaries[lang];
}
