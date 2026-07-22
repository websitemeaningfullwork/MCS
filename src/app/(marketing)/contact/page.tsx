import type { Metadata } from "next";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { T } from "@/components/shared/t";
import { SITE } from "@/lib/constants";
import type { Bi } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Meaningful Career Academy team.",
};

const points: { icon: typeof Mail; title: Bi; body: Bi }[] = [
  {
    icon: Mail,
    title: { en: "Email us", bn: "ইমেইল করুন" },
    body: { en: SITE.email, bn: SITE.email },
  },
  {
    icon: MessageCircle,
    title: { en: "Ask a mentor", bn: "মেন্টরকে প্রশ্ন করুন" },
    body: {
      en: "Students can ask questions right from their dashboard.",
      bn: "শিক্ষার্থীরা ড্যাশবোর্ড থেকেই সরাসরি প্রশ্ন করতে পারেন।",
    },
  },
  {
    icon: Clock,
    title: { en: "Response time", bn: "উত্তরের সময়" },
    body: {
      en: "We usually reply within 24–48 hours.",
      bn: "সাধারণত ২৪–৪৮ ঘণ্টার মধ্যে আমরা উত্তর দিই।",
    },
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-primary">
          <T en="Contact" bn="যোগাযোগ" />
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          <T en="We'd love to hear from you" bn="আপনার কথা শুনতে চাই আমরা" />
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          <T
            en="Questions about programs, mentorship, or payments? Send us a message and we'll get back to you."
            bn="প্রোগ্রাম, মেন্টরশিপ বা পেমেন্ট নিয়ে প্রশ্ন? আমাদের মেসেজ পাঠান, আমরা দ্রুত উত্তর দেব।"
          />
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          {points.map((p) => (
            <div
              key={p.title.en}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">
                  <T {...p.title} />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <T {...p.body} />
                </p>
              </div>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
