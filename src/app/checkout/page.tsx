import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  Hash,
  Infinity as InfinityIcon,
  Lock,
  Mail,
  MessageCircle,
  MessagesSquare,
  QrCode,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Upload,
  Users,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CopyNumberButton } from "@/components/checkout/copy-number-button";
import { FreeEnrollButton } from "@/components/checkout/free-enroll-button";
import { formatBDT, effectivePriceBDT, hasDiscount } from "@/lib/format";
import { SITE, COMMUNITY } from "@/lib/constants";

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

const PAY_STEPS = [
  {
    title: "Open bKash",
    detail: "Launch the bKash app on your phone.",
    icon: Smartphone,
    tint: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    badge: "bg-pink-600",
  },
  {
    title: "Tap Send Money",
    detail: "Choose the Send Money option.",
    icon: Send,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    badge: "bg-orange-500",
  },
  {
    title: "Enter the Number",
    detail: "Type the payment number shown above.",
    icon: Hash,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    badge: "bg-violet-600",
  },
  {
    title: "Enter Amount",
    detail: "Enter the exact amount to pay.",
    icon: BadgeDollarSign,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badge: "bg-blue-600",
  },
  {
    title: "Confirm Payment",
    detail: "Complete the payment with your PIN.",
    icon: CheckCircle2,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-600",
  },
  {
    title: "Copy Transaction ID",
    detail: "Copy the TrxID from your confirmation.",
    icon: Copy,
    tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-600",
  },
  {
    title: "Submit Details",
    detail: "Fill the form and submit for verification.",
    icon: Upload,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    badge: "bg-orange-500",
  },
] as const;

const FOOTER_STRIP = [
  { label: "SSL Secured", icon: Lock },
  { label: "100% Safe Payment", icon: ShieldCheck },
  { label: "Manual Verification", icon: BadgeCheck },
  { label: "Fast Confirmation", icon: Zap },
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

  const ratingValue = rating ?? 0;

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
              {/* Order summary card */}
              <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                <div className="flex gap-4 p-5 sm:p-6">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/15 via-secondary to-sky-400/15 sm:size-28">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <span className="text-2xl font-semibold text-blue-600/40">
                          {title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-foreground">{title}</h2>
                    {subtitle ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {subtitle}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {ratingValue > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-foreground">
                            {ratingValue.toFixed(1)}
                          </span>
                          {reviewsCount ? <span>({reviewsCount})</span> : null}
                        </span>
                      ) : null}
                      {enrolledCount && enrolledCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" />
                          {enrolledCount.toLocaleString("en-US")} students
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="border-t border-border px-5 py-3 sm:px-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    <InfinityIcon className="size-3.5" />
                    Lifetime Access
                  </span>
                </div>
              </section>

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
              {/* Payment method card */}
              <section className="overflow-hidden rounded-3xl border border-pink-500/20 bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border bg-pink-500/5 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[#e2136e]/10 text-[#e2136e]">
                      <Smartphone className="size-5" />
                    </span>
                    <h2 className="font-semibold text-foreground">
                      Payment Method
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <ShieldCheck className="size-3.5" />
                    100% Secure
                  </span>
                </div>

                {settings ? (
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[#e2136e] px-2 py-0.5 text-xs font-bold text-white">
                        bKash
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Send Money
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Payment Number
                        </p>
                        <p className="mt-1 text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
                          {settings.bkash_number}
                        </p>
                        <div className="mt-3">
                          <CopyNumberButton value={settings.bkash_number} />
                        </div>
                      </div>

                      {/* QR tile */}
                      <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <div className="flex size-24 items-center justify-center rounded-2xl border border-pink-500/20 bg-white text-[#e2136e] shadow-sm transition-transform duration-300 hover:scale-105">
                          <QrCode className="size-14" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Scan &amp; Pay
                        </span>
                      </div>
                    </div>

                    {settings.instructions ? (
                      <p className="mt-4 rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                        {settings.instructions}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="p-5 sm:p-6">
                    <p className="text-sm text-muted-foreground">
                      Payment details are being configured. Please check back
                      shortly or contact support.
                    </p>
                  </div>
                )}
              </section>

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

          {/* ============================================================
              HOW TO PAY
              ============================================================ */}
          <section className="mt-14">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                How to Pay with bKash
              </h2>
              <p className="mt-2 text-muted-foreground">
                Seven simple steps — you&apos;ll be done in under a minute.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              {PAY_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="card-hover flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-card"
                >
                  <div className="relative">
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl ${step.tint}`}
                    >
                      <step.icon className="size-6" />
                    </span>
                    <span
                      className={`absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-xs font-bold text-white ${step.badge}`}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================
              NEED HELP
              ============================================================ */}
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
                  Our support team is here for you. Reach out any way you like —
                  we usually reply fast.
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

          {/* ============================================================
              FOOTER STRIP
              ============================================================ */}
          <section className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-3xl border border-border bg-card px-6 py-5 shadow-card">
            {FOOTER_STRIP.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <item.icon className="size-4 text-success" />
                {item.label}
              </span>
            ))}
          </section>
        </>
      )}
    </div>
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
