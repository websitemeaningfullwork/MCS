/** Site-wide constants. Edit these placeholder URLs when the client provides real ones. */

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
export const NAV_CATEGORIES = [
  { slug: "university-admission", label: "University Admission", icon: "graduation-cap" },
  { slug: "hsc", label: "HSC", icon: "book-open" },
  { slug: "ssc", label: "SSC", icon: "book" },
  { slug: "programming", label: "Programming", icon: "code" },
  { slug: "ai", label: "AI", icon: "brain" },
  { slug: "english", label: "English", icon: "languages" },
  { slug: "career-development", label: "Career Development", icon: "briefcase" },
  { slug: "productivity", label: "Productivity", icon: "zap" },
  { slug: "soft-skills", label: "Soft Skills", icon: "users" },
  { slug: "free-programs", label: "Free Programs", icon: "gift" },
] as const;

/** Homepage "Why MCA" pillars. */
export const WHY_MCA = [
  {
    icon: "user-round",
    title: "A Personal Mentor",
    description:
      "Learn with a real mentor who guides you, answers your questions, and keeps you accountable.",
  },
  {
    icon: "radio",
    title: "Live Guidance",
    description:
      "Join live sessions and get your doubts cleared in real time — not just pre-recorded videos.",
  },
  {
    icon: "route",
    title: "A Structured Path",
    description:
      "Follow a clear, step-by-step roadmap designed to take you from where you are to where you want to be.",
  },
  {
    icon: "briefcase",
    title: "Career Support",
    description:
      "From CVs to interviews, get practical help that turns learning into a real, meaningful career.",
  },
] as const;

/**
 * Static homepage testimonials — safe placeholder content for the MVP.
 * Chunk 5 (review system) will replace this with real approved course reviews.
 */
export const TESTIMONIALS = [
  {
    name: "Nusrat J.",
    role: "University Admission Student",
    rating: 5,
    quote:
      "My mentor didn't just teach me — they kept me on track every single week. I got into my dream university.",
  },
  {
    name: "Tanvir A.",
    role: "Aspiring Developer",
    rating: 5,
    quote:
      "The structured path and code reviews changed everything. I built real projects and landed my first internship.",
  },
  {
    name: "Rifah S.",
    role: "Career Changer",
    rating: 5,
    quote:
      "The career support was unreal. My CV and interview prep finally made sense with a mentor guiding me.",
  },
  {
    name: "Sabbir R.",
    role: "HSC Student",
    rating: 5,
    quote:
      "Weekly check-ins with my mentor kept me consistent. My grades and my confidence both went up.",
  },
  {
    name: "Mitu A.",
    role: "Job Seeker",
    rating: 5,
    quote:
      "The interview prep and CV review were spot on. I walked into my interview genuinely prepared.",
  },
  {
    name: "Arif H.",
    role: "Freelancer",
    rating: 4,
    quote:
      "I finally had a clear roadmap instead of random tutorials. That focus changed how fast I grew.",
  },
] as const;

/**
 * Homepage "Achievements / Winners" gallery — placeholder social proof for the
 * MVP (the client replaces these with real student outcomes). Green is avoided
 * on the decorative tiles per the brand rule (green = status only).
 */
export const ACHIEVEMENTS = [
  {
    name: "Rahim H.",
    achievement: "Admitted to BUET — CSE",
    program: "University Admission",
    tint: "from-blue-500 to-indigo-500",
  },
  {
    name: "Ayesha K.",
    achievement: "Full scholarship at NSU",
    program: "University Admission",
    tint: "from-violet-500 to-purple-500",
  },
  {
    name: "Tanvir A.",
    achievement: "First developer internship",
    program: "Programming",
    tint: "from-amber-500 to-orange-500",
  },
  {
    name: "Mitu A.",
    achievement: "Landed a full-time job",
    program: "Career Development",
    tint: "from-sky-500 to-cyan-500",
  },
  {
    name: "Sadia R.",
    achievement: "Cracked IELTS 7.5",
    program: "English",
    tint: "from-rose-500 to-pink-500",
  },
  {
    name: "Nabil I.",
    achievement: "Ranked top 50 in mock tests",
    program: "HSC",
    tint: "from-orange-500 to-amber-500",
  },
] as const;

/** Right-hand highlight links for the Programs mega menu. */
export const MEGA_HIGHLIGHTS: {
  label: string;
  href: string;
  badge?: string;
}[] = [
  { label: "Featured Programs", href: "/programs", badge: "Popular" },
  { label: "Best Sellers", href: "/programs?sort=popular" },
  { label: "Trending Now", href: "/programs?sort=trending" },
  { label: "Recently Added", href: "/programs?sort=new" },
  { label: "Free Programs", href: "/programs?category=free-programs", badge: "Free" },
];

/** Compact social-proof metrics shown in the footer strip. */
export const FOOTER_METRICS = [
  { value: "5,000+", label: "Students guided" },
  { value: "120+", label: "Programs & e-books" },
  { value: "25,000+", label: "Questions answered" },
  { value: "94%", label: "Success rate" },
] as const;
