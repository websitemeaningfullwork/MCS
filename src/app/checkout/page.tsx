import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { FreeEnrollButton } from "@/components/checkout/free-enroll-button";
import { OrderSummaryCard } from "@/components/checkout/order-summary";
import { BkashCard } from "@/components/checkout/bkash-card";
import { HowToPay } from "@/components/checkout/how-to-pay";
import { NeedHelp } from "@/components/checkout/need-help";
import { TrustFooterStrip } from "@/components/checkout/footer-strip";
import { formatBDT, effectivePriceBDT, hasDiscount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Secure Checkout",
};

const COURSE_BENEFITS = [
  "HD Video Lessons",
  "Live Classes",
  "Practice Sessions",
  "Mentor Support",
  "Certificate of Completion",
  "Downloadable Resources",
  "Lifetime Access",
  "Future Updates",
] as const;

const BONUS_ITEMS = [
  "Exclusive Study Materials",
  "Ready-to-use Templates",
  "Private Community Access",
  "Mock Tests & Quizzes",
] as const;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;
  if ((type !== "program" && type !== "resource") || !id) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout?type=${type}%26id=${id}`);

  // Load the item.
  let title = "";
  let subtitle: string | null = null;
  let coverUrl: string | null = null;
  let rating: number | null = null;
  let reviewsCount: number | null = null;
  let enrolledCount: number | null = null;
  let backHref = "/programs";
  let basePrice = 0;
  let discount: number | null = null;

  if (type === "program") {
    const { data } = await supabase
      .from("programs")
      .select(
        "title, subtitle, cover_url, rating, reviews_count, enrolled_count, price_bdt, discount_bdt, status, slug",
      )
      .eq("id", id)
      .maybeSingle();
    if (!data || data.status !== "published") notFound();
    title = data.title;
    subtitle = data.subtitle;
    coverUrl = data.cover_url;
    rating = data.rating;
    reviewsCount = data.reviews_count;
    enrolledCount = data.enrolled_count;
    basePrice = data.price_bdt;
    discount = data.discount_bdt;
    backHref = `/programs/${data.slug}`;
  } else {
    const { data } = await supabase
      .from("public_resources")
      .select("title, description, cover_url, price_bdt, slug")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    title = data.title;
    subtitle = data.description;
    coverUrl = data.cover_url;
    basePrice = data.price_bdt ?? 0;
    backHref = `/resources/${data.slug}`;
  }

  const price = effectivePriceBDT(basePrice, discount);
  const showDiscount = hasDiscount(basePrice, discount);
  const savings = showDiscount ? basePrice - price : 0;
  const isFree = price <= 0;

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col gap-4">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {type === "program" ? "course" : "library"}
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Secure <span className="text-success">Checkout</span>
          </h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5 text-success" />
            256-bit Secure Payment
          </p>
        </div>
      </div>

      {isFree ? (
        <FreeCheckout
          title={title}
          coverUrl={coverUrl}
          type={type}
          id={id}
          backHref={backHref}
        />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* ============================================================
                LEFT COLUMN — everything about the course
                ============================================================ */}
            <div className="space-y-6">
              <OrderSummaryCard
                title={title}
                subtitle={subtitle}
                coverUrl={coverUrl}
                rating={rating}
                reviewsCount={reviewsCount}
                enrolledCount={enrolledCount}
              />

              {/* What you will get */}
              <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
                <h2 className="font-semibold text-foreground">
                  What you will get in this course
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {COURSE_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-center gap-2.5 text-sm text-foreground"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check className="size-3.5" />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Bonus */}
              <section className="rounded-3xl border border-success/25 bg-success/5 p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
                    <Gift className="size-5" />
                  </span>
                  <h2 className="font-semibold text-foreground">
                    Bonus — included free
                  </h2>
                </div>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {BONUS_ITEMS.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Sparkles className="size-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Pricing breakdown */}
              <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
                <h2 className="font-semibold text-foreground">Price details</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Original Price</dt>
                    <dd
                      className={
                        showDiscount
                          ? "text-muted-foreground line-through"
                          : "font-medium text-foreground"
                      }
                    >
                      {formatBDT(basePrice)}
                    </dd>
                  </div>
                  {showDiscount ? (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="font-medium text-success">
                        −{formatBDT(savings)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <dt className="font-medium text-foreground">Total</dt>
                    <dd className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                      {formatBDT(price)}
                    </dd>
                  </div>
                </dl>
                {showDiscount ? (
                  <p className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <BadgeCheck className="size-4" />
                    You are saving {formatBDT(savings)} today.
                  </p>
                ) : null}
              </section>
            </div>

            {/* ============================================================
                RIGHT COLUMN — everything about payment
                ============================================================ */}
            <div className="space-y-6">
              <BkashCard settings={settings} />

              {/* Verify payment card */}
              {settings ? (
                <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="size-5" />
                    </span>
                    <h2 className="font-semibold text-foreground">
                      Verify Your Payment
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    After completing payment, submit your payment information
                    below.
                  </p>
                  <div className="mt-5">
                    <CheckoutForm
                      type={type}
                      id={id}
                      amount={price}
                      userId={user.id}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          <HowToPay />
          <NeedHelp />
          <TrustFooterStrip className="mt-10" />
        </>
      )}
    </div>
  );
}

function FreeCheckout({
  title,
  coverUrl,
  type,
  id,
  backHref,
}: {
  title: string;
  coverUrl: string | null;
  type: "program" | "resource";
  id: string;
  backHref: string;
}) {
  return (
    <div className="mx-auto mt-8 max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-8">
        <div className="relative mx-auto size-28 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/15 via-secondary to-sky-400/15">
          {coverUrl ? (
            <Image src={coverUrl} alt={title} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Gift className="size-10 text-blue-600/40" />
            </div>
          )}
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <Sparkles className="size-3.5" />
          This one&apos;s on us
        </span>
        <h2 className="mt-3 text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This item is free — get instant access. It will appear in your
          dashboard right away.
        </p>
        <div className="mt-6">
          <FreeEnrollButton type={type} id={id} />
        </div>
        <Link
          href={backHref}
          className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          Changed your mind? Keep browsing
        </Link>
      </div>
    </div>
  );
}
