/** Site-wide constants. Edit these placeholder URLs when the client provides real ones. */

export const SITE = {
  name: "Meaningful Career Academy",
  shortName: "MCA",
  description:
    "A premium, mentorship-first educational platform. Find the right mentor and build a meaningful career.",
  email: "hello@mca.academy",
};

/** Community links — replace with the real Facebook / WhatsApp group URLs. */
export const COMMUNITY = {
  facebook: "https://facebook.com/groups/your-mca-group",
  whatsapp: "https://chat.whatsapp.com/your-invite-code",
};

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
