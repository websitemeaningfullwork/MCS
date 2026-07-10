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

/** Static homepage testimonials (safe placeholder content for MVP). */
export const TESTIMONIALS = [
  {
    name: "Nusrat J.",
    role: "University Admission Student",
    quote:
      "My mentor didn't just teach me — they kept me on track every single week. I got into my dream university.",
  },
  {
    name: "Tanvir A.",
    role: "Aspiring Developer",
    quote:
      "The structured path and code reviews changed everything. I built real projects and landed my first internship.",
  },
  {
    name: "Rifah S.",
    role: "Career Changer",
    quote:
      "The career support was unreal. My CV and interview prep finally made sense with a mentor guiding me.",
  },
] as const;
