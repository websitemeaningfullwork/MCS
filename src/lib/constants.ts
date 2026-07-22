/** Site-wide constants. Edit these placeholder URLs when the client provides real ones. */

import type { Bi } from "@/lib/i18n";

export const SITE = {
  name: "Meaningful Career Academy",
  shortName: "MCA",
  description:
    "A premium, mentorship-first educational platform. Find the right mentor and build a meaningful career.",
  email: "hello@mca.academy",
};

/**
 * Community links. Set these in the environment for production; when a link is
 * blank the corresponding button is hidden so we never ship a dead placeholder.
 */
export const COMMUNITY = {
  facebook: process.env.NEXT_PUBLIC_COMMUNITY_FACEBOOK_URL ?? "",
  whatsapp: process.env.NEXT_PUBLIC_COMMUNITY_WHATSAPP_URL ?? "",
};

/** Program categories shown in the navbar Programs dropdown. */
export const NAV_CATEGORIES: readonly {
  slug: string;
  label: Bi;
  icon: string;
}[] = [
  {
    slug: "university-admission",
    label: { en: "University Admission", bn: "বিশ্ববিদ্যালয় ভর্তি" },
    icon: "graduation-cap",
  },
  { slug: "hsc", label: { en: "HSC", bn: "এইচএসসি" }, icon: "book-open" },
  { slug: "ssc", label: { en: "SSC", bn: "এসএসসি" }, icon: "book" },
  { slug: "programming", label: { en: "Programming", bn: "প্রোগ্রামিং" }, icon: "code" },
  { slug: "ai", label: { en: "AI", bn: "এআই" }, icon: "brain" },
  { slug: "english", label: { en: "English", bn: "ইংরেজি" }, icon: "languages" },
  {
    slug: "career-development",
    label: { en: "Career Development", bn: "ক্যারিয়ার ডেভেলপমেন্ট" },
    icon: "briefcase",
  },
  { slug: "productivity", label: { en: "Productivity", bn: "প্রোডাক্টিভিটি" }, icon: "zap" },
  { slug: "soft-skills", label: { en: "Soft Skills", bn: "সফট স্কিল" }, icon: "users" },
  {
    slug: "free-programs",
    label: { en: "Free Programs", bn: "ফ্রি প্রোগ্রাম" },
    icon: "gift",
  },
] as const;

/** Homepage "Why MCA" pillars. */
export const WHY_MCA: readonly {
  icon: string;
  title: Bi;
  description: Bi;
}[] = [
  {
    icon: "user-round",
    title: { en: "A Personal Mentor", bn: "ব্যক্তিগত মেন্টর" },
    description: {
      en: "Learn with a real mentor who guides you, answers your questions, and keeps you accountable.",
      bn: "এমন একজন মেন্টরের সাথে শিখুন, যিনি আপনাকে পথ দেখাবেন, প্রশ্নের উত্তর দেবেন এবং নিয়মিত অগ্রগতির খোঁজ রাখবেন।",
    },
  },
  {
    icon: "radio",
    title: { en: "Live Guidance", bn: "লাইভ দিকনির্দেশনা" },
    description: {
      en: "Join live sessions and get your doubts cleared in real time — not just pre-recorded videos.",
      bn: "শুধু রেকর্ডেড ভিডিও নয় — লাইভ সেশনে যোগ দিয়ে সাথে সাথেই আপনার সব প্রশ্নের সমাধান নিন।",
    },
  },
  {
    icon: "route",
    title: { en: "A Structured Path", bn: "গোছানো রোডম্যাপ" },
    description: {
      en: "Follow a clear, step-by-step roadmap designed to take you from where you are to where you want to be.",
      bn: "আপনি এখন যেখানে আছেন, সেখান থেকে লক্ষ্যে পৌঁছে দিতে ধাপে ধাপে সাজানো স্পষ্ট রোডম্যাপ অনুসরণ করুন।",
    },
  },
  {
    icon: "briefcase",
    title: { en: "Career Support", bn: "ক্যারিয়ার সাপোর্ট" },
    description: {
      en: "From CVs to interviews, get practical help that turns learning into a real, meaningful career.",
      bn: "সিভি থেকে ইন্টারভিউ — শেখাকে সত্যিকারের অর্থবহ ক্যারিয়ারে রূপ দিতে হাতে-কলমে সহায়তা পান।",
    },
  },
] as const;

/**
 * Static homepage testimonials — safe placeholder content for the MVP.
 * Real approved course reviews (Chunk 5) take priority; these seeds only show
 * before any reviews exist. Quotes/roles are bilingual; names stay as-is.
 */
export const TESTIMONIALS: readonly {
  name: string;
  role: Bi;
  rating: number;
  quote: Bi;
}[] = [
  {
    name: "Nusrat J.",
    role: { en: "University Admission Student", bn: "বিশ্ববিদ্যালয় ভর্তি শিক্ষার্থী" },
    rating: 5,
    quote: {
      en: "My mentor didn't just teach me — they kept me on track every single week. I got into my dream university.",
      bn: "আমার মেন্টর শুধু পড়াননি — প্রতিটি সপ্তাহে আমাকে ঠিক পথে রেখেছেন। আমি আমার স্বপ্নের বিশ্ববিদ্যালয়ে চান্স পেয়েছি।",
    },
  },
  {
    name: "Tanvir A.",
    role: { en: "Aspiring Developer", bn: "ভবিষ্যৎ ডেভেলপার" },
    rating: 5,
    quote: {
      en: "The structured path and code reviews changed everything. I built real projects and landed my first internship.",
      bn: "গোছানো রোডম্যাপ আর কোড রিভিউ সবকিছু বদলে দিয়েছে। সত্যিকারের প্রজেক্ট বানিয়ে আমার প্রথম ইন্টার্নশিপ পেয়ে গেছি।",
    },
  },
  {
    name: "Rifah S.",
    role: { en: "Career Changer", bn: "ক্যারিয়ার পরিবর্তনকারী" },
    rating: 5,
    quote: {
      en: "The career support was unreal. My CV and interview prep finally made sense with a mentor guiding me.",
      bn: "ক্যারিয়ার সাপোর্ট ছিল অসাধারণ। মেন্টরের গাইডলাইনে সিভি আর ইন্টারভিউ প্রস্তুতি অবশেষে সত্যিই কাজে লেগেছে।",
    },
  },
  {
    name: "Sabbir R.",
    role: { en: "HSC Student", bn: "এইচএসসি শিক্ষার্থী" },
    rating: 5,
    quote: {
      en: "Weekly check-ins with my mentor kept me consistent. My grades and my confidence both went up.",
      bn: "মেন্টরের সাথে সাপ্তাহিক চেক-ইন আমাকে নিয়মিত রেখেছে। আমার রেজাল্ট আর আত্মবিশ্বাস — দুটোই বেড়েছে।",
    },
  },
  {
    name: "Mitu A.",
    role: { en: "Job Seeker", bn: "চাকরিপ্রার্থী" },
    rating: 5,
    quote: {
      en: "The interview prep and CV review were spot on. I walked into my interview genuinely prepared.",
      bn: "ইন্টারভিউ প্রস্তুতি আর সিভি রিভিউ ছিল একদম নিখুঁত। পুরো প্রস্তুতি নিয়েই ইন্টারভিউ দিতে গিয়েছিলাম।",
    },
  },
  {
    name: "Arif H.",
    role: { en: "Freelancer", bn: "ফ্রিল্যান্সার" },
    rating: 4,
    quote: {
      en: "I finally had a clear roadmap instead of random tutorials. That focus changed how fast I grew.",
      bn: "এলোমেলো টিউটোরিয়ালের বদলে অবশেষে একটা স্পষ্ট রোডম্যাপ পেয়েছি। সেই ফোকাসই আমার এগিয়ে যাওয়ার গতি বদলে দিয়েছে।",
    },
  },
] as const;

/**
 * Homepage "Achievements / Winners" gallery — placeholder social proof for the
 * MVP (the client replaces these with real student outcomes). Green is avoided
 * on the decorative tiles per the brand rule (green = status only).
 */
export const ACHIEVEMENTS: readonly {
  name: string;
  achievement: Bi;
  program: Bi;
  tint: string;
}[] = [
  {
    name: "Rahim H.",
    achievement: { en: "Admitted to BUET — CSE", bn: "বুয়েটে ভর্তি — সিএসই" },
    program: { en: "University Admission", bn: "বিশ্ববিদ্যালয় ভর্তি" },
    tint: "from-blue-500 to-indigo-500",
  },
  {
    name: "Ayesha K.",
    achievement: { en: "Full scholarship at NSU", bn: "NSU-তে ফুল স্কলারশিপ" },
    program: { en: "University Admission", bn: "বিশ্ববিদ্যালয় ভর্তি" },
    tint: "from-violet-500 to-purple-500",
  },
  {
    name: "Tanvir A.",
    achievement: { en: "First developer internship", bn: "প্রথম ডেভেলপার ইন্টার্নশিপ" },
    program: { en: "Programming", bn: "প্রোগ্রামিং" },
    tint: "from-amber-500 to-orange-500",
  },
  {
    name: "Mitu A.",
    achievement: { en: "Landed a full-time job", bn: "ফুল-টাইম চাকরি অর্জন" },
    program: { en: "Career Development", bn: "ক্যারিয়ার ডেভেলপমেন্ট" },
    tint: "from-sky-500 to-cyan-500",
  },
  {
    name: "Sadia R.",
    achievement: { en: "Cracked IELTS 7.5", bn: "IELTS-এ ৭.৫ স্কোর" },
    program: { en: "English", bn: "ইংরেজি" },
    tint: "from-rose-500 to-pink-500",
  },
  {
    name: "Nabil I.",
    achievement: { en: "Ranked top 50 in mock tests", bn: "মক টেস্টে সেরা ৫০-এ" },
    program: { en: "HSC", bn: "এইচএসসি" },
    tint: "from-orange-500 to-amber-500",
  },
] as const;

/** Right-hand highlight links for the Programs mega menu. */
export const MEGA_HIGHLIGHTS: readonly {
  label: Bi;
  href: string;
  badge?: Bi;
}[] = [
  {
    label: { en: "Featured Programs", bn: "ফিচার্ড প্রোগ্রাম" },
    href: "/programs",
    badge: { en: "Popular", bn: "জনপ্রিয়" },
  },
  { label: { en: "Best Sellers", bn: "বেস্ট সেলার" }, href: "/programs?sort=popular" },
  { label: { en: "Trending Now", bn: "এখন ট্রেন্ডিং" }, href: "/programs?sort=trending" },
  { label: { en: "Recently Added", bn: "সম্প্রতি যুক্ত" }, href: "/programs?sort=new" },
  {
    label: { en: "Free Programs", bn: "ফ্রি প্রোগ্রাম" },
    href: "/programs?category=free-programs",
    badge: { en: "Free", bn: "ফ্রি" },
  },
] as const;

/** Compact social-proof metrics shown in the footer strip. */
export const FOOTER_METRICS: readonly { value: string; label: Bi }[] = [
  { value: "5,000+", label: { en: "Students guided", bn: "শিক্ষার্থী গাইড পেয়েছে" } },
  { value: "120+", label: { en: "Programs & e-books", bn: "প্রোগ্রাম ও ই-বুক" } },
  { value: "25,000+", label: { en: "Questions answered", bn: "প্রশ্নের উত্তর দেওয়া হয়েছে" } },
  { value: "94%", label: { en: "Success rate", bn: "সাফল্যের হার" } },
] as const;
