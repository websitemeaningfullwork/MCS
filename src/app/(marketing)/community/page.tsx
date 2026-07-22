import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, MessagesSquare, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { T } from "@/components/shared/t";
import { COMMUNITY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the MCA learning community — connect with peers, stay motivated, and grow together.",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("blog_posts")
    .select("id, slug, title, published_at")
    .eq("status", "published")
    .contains("tags", ["announcement"])
    .order("published_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          <T en="Join our learning community" bn="আমাদের লার্নিং কমিউনিটিতে যোগ দিন" />
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          <T
            en="Learning is better together. Connect with fellow students, ask questions, share your wins, and stay motivated."
            bn="একসাথে শিখলে শেখা আরও ভালো হয়। সহপাঠীদের সাথে যুক্ত হোন, প্রশ্ন করুন, সাফল্য শেয়ার করুন, আর অনুপ্রাণিত থাকুন।"
          />
        </p>
        {COMMUNITY.facebook || COMMUNITY.whatsapp ? (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {COMMUNITY.facebook ? (
              <Button asChild size="lg" className="rounded-full">
                <a href={COMMUNITY.facebook} target="_blank" rel="noopener noreferrer">
                  <MessagesSquare className="size-4" />
                  <T en="Facebook Group" bn="ফেসবুক গ্রুপ" />
                </a>
              </Button>
            ) : null}
            {COMMUNITY.whatsapp ? (
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <a href={COMMUNITY.whatsapp} target="_blank" rel="noopener noreferrer">
                  <T en="WhatsApp Group" bn="হোয়াটসঅ্যাপ গ্রুপ" />
                </a>
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            <T
              en="Community links are coming soon — check back shortly."
              bn="কমিউনিটি লিংক শিগগিরই আসছে — একটু পরে আবার দেখুন।"
            />
          </p>
        )}
      </div>

      {announcements && announcements.length > 0 ? (
        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Megaphone className="size-5 text-primary" />
            <T en="Announcements" bn="ঘোষণা" />
          </h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {announcements.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50"
                >
                  <span className="font-medium text-foreground">{a.title}</span>
                  {a.published_at ? (
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
