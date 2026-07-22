import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, HeartHandshake, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T } from "@/components/shared/t";
import type { Bi } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meaningful Career Academy is a premium, mentorship-first educational platform helping students build meaningful careers.",
};

const values: { icon: typeof HeartHandshake; title: Bi; body: Bi }[] = [
  {
    icon: HeartHandshake,
    title: { en: "Mentorship first", bn: "মেন্টরশিপই প্রথম" },
    body: {
      en: "People grow fastest with a guide. Every part of MCA exists to strengthen the relationship between a student and their mentor.",
      bn: "একজন গাইড পাশে থাকলে মানুষ সবচেয়ে দ্রুত এগোয়। MCA-র প্রতিটি অংশের লক্ষ্য শিক্ষার্থী ও মেন্টরের সম্পর্ককে মজবুত করা।",
    },
  },
  {
    icon: Target,
    title: { en: "Trust before sales", bn: "বিক্রির আগে বিশ্বাস" },
    body: {
      en: "We're not here to push courses. We're here to help you make good decisions about your learning and your career.",
      bn: "আমরা কোর্স গছিয়ে দিতে আসিনি। আপনার পড়াশোনা ও ক্যারিয়ার নিয়ে সঠিক সিদ্ধান্ত নিতে সাহায্য করতেই আমরা আছি।",
    },
  },
  {
    icon: Compass,
    title: { en: "Human-centered", bn: "মানুষকেন্দ্রিক" },
    body: {
      en: "Clean, calm, and premium by design — so learning feels supportive, not overwhelming.",
      bn: "পরিচ্ছন্ন, শান্ত ও প্রিমিয়াম ডিজাইন — যাতে শেখাটা মনে হয় সহায়ক, চাপের নয়।",
    },
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <header>
        <p className="text-sm font-medium text-primary">
          <T en="About MCA" bn="MCA সম্পর্কে" />
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          <T en="Guidance, not just courses." bn="শুধু কোর্স নয়, দিকনির্দেশনা।" />
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          <T
            en="Meaningful Career Academy (MCA) is a premium, mentorship-first educational platform for Bangladesh. We believe students deserve more than video libraries — they deserve a mentor who guides them, answers their questions, and holds them accountable."
            bn="Meaningful Career Academy (MCA) বাংলাদেশের জন্য একটি প্রিমিয়াম, মেন্টরশিপ-ফার্স্ট শিক্ষা প্ল্যাটফর্ম। আমরা বিশ্বাস করি — শিক্ষার্থীরা শুধু ভিডিওর ভাণ্ডার নয়, এমন একজন মেন্টর পাওয়ার যোগ্য, যিনি পথ দেখাবেন, প্রশ্নের উত্তর দেবেন এবং নিয়মিত অগ্রগতির খোঁজ রাখবেন।"
          />
        </p>
      </header>

      <section className="mt-14 space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            <T en="Our mission" bn="আমাদের মিশন" />
          </h2>
          <p className="mt-3 text-muted-foreground">
            <T
              en="Help students build meaningful careers through personalized mentorship, structured learning, practical skills, and continuous support — all within one modern, fast, beautifully designed ecosystem."
              bn="ব্যক্তিগত মেন্টরশিপ, গোছানো লার্নিং, ব্যবহারিক দক্ষতা আর নিরবচ্ছিন্ন সাপোর্টের মাধ্যমে শিক্ষার্থীদের অর্থবহ ক্যারিয়ার গড়তে সহায়তা করা — সবকিছু একটি আধুনিক, দ্রুত ও সুন্দরভাবে ডিজাইন করা ইকোসিস্টেমে।"
            />
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            <T en="Our vision" bn="আমাদের ভিশন" />
          </h2>
          <p className="mt-3 text-muted-foreground">
            <T
              en="To build Bangladesh's most trusted mentorship ecosystem — where students don't just buy courses, they receive guidance, accountability, and clear career direction."
              bn="বাংলাদেশের সবচেয়ে বিশ্বস্ত মেন্টরশিপ ইকোসিস্টেম গড়ে তোলা — যেখানে শিক্ষার্থীরা শুধু কোর্স কেনে না; পায় দিকনির্দেশনা, জবাবদিহিতা এবং স্পষ্ট ক্যারিয়ার গাইডলাইন।"
            />
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          <T en="What we value" bn="আমাদের মূল্যবোধ" />
        </h2>
        <div className="mt-6 space-y-4">
          {values.map((v) => (
            <div
              key={v.title.en}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">
                  <T {...v.title} />
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <T {...v.body} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-brand-hover/10 p-8 text-center shadow-card">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          <T en="Ready to find your mentor?" bn="আপনার মেন্টর খুঁজে নিতে প্রস্তুত?" />
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          <T
            en="Browse our mentors and programs, and take the first step toward a meaningful career."
            bn="আমাদের মেন্টর ও প্রোগ্রামগুলো ঘুরে দেখুন, আর অর্থবহ ক্যারিয়ারের পথে প্রথম ধাপটি নিন।"
          />
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/mentors">
              <T en="Meet the mentors" bn="মেন্টরদের সাথে পরিচিত হোন" />
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/programs">
              <T en="Browse programs" bn="প্রোগ্রাম দেখুন" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
