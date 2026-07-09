import type { Metadata } from "next";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Meaningful Career Academy team.",
};

const points = [
  {
    icon: Mail,
    title: "Email us",
    body: SITE.email,
  },
  {
    icon: MessageCircle,
    title: "Ask a mentor",
    body: "Students can ask questions right from their dashboard.",
  },
  {
    icon: Clock,
    title: "Response time",
    body: "We usually reply within 24–48 hours.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Contact</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          We&apos;d love to hear from you
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Questions about programs, mentorship, or payments? Send us a message
          and we&apos;ll get back to you.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          {points.map((p) => (
            <div
              key={p.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">{p.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
