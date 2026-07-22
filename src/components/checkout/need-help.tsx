import Link from "next/link";
import { Mail, MessageCircle, MessagesSquare, Send } from "lucide-react";

import { SITE, COMMUNITY } from "@/lib/constants";

/** "Need help?" support block — 4 clickable channel cards. */
export function NeedHelp() {
  return (
    <section className="mt-14">
      <div className="grid items-center gap-6 rounded-3xl border border-border bg-gradient-to-br from-blue-500/5 via-card to-sky-400/5 p-6 shadow-card md:grid-cols-2 sm:p-8">
        <div>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <MessagesSquare className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            Need help with your payment?
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Our support team is here for you. Reach out any way you like — we usually reply
            fast.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HelpCard
            href={COMMUNITY.whatsapp || "/contact"}
            external={Boolean(COMMUNITY.whatsapp)}
            icon={MessageCircle}
            label="WhatsApp"
            hint="Chat with us"
            tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <HelpCard
            href="/contact"
            icon={MessagesSquare}
            label="Live Chat"
            hint="Send a message"
            tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <HelpCard
            href={`mailto:${SITE.email}`}
            external
            icon={Mail}
            label="Email"
            hint={SITE.email}
            tint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <HelpCard
            href={COMMUNITY.facebook || "/contact"}
            external={Boolean(COMMUNITY.facebook)}
            icon={Send}
            label="Messenger"
            hint="Message us"
            tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
        </div>
      </div>
    </section>
  );
}

function HelpCard({
  href,
  external,
  icon: Icon,
  label,
  hint,
  tint,
}: {
  href: string;
  external?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  tint: string;
}) {
  const inner = (
    <>
      <span className={`flex size-10 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </>
  );
  const className =
    "card-hover flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
