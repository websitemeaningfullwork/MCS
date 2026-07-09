import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Smartphone, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { FreeEnrollButton } from "@/components/checkout/free-enroll-button";
import { formatBDT, effectivePriceBDT, hasDiscount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Checkout",
};

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
  let basePrice = 0;
  let discount: number | null = null;

  if (type === "program") {
    const { data } = await supabase
      .from("programs")
      .select("title, price_bdt, discount_bdt, status")
      .eq("id", id)
      .maybeSingle();
    if (!data || data.status !== "published") notFound();
    title = data.title;
    basePrice = data.price_bdt;
    discount = data.discount_bdt;
  } else {
    const { data } = await supabase
      .from("resources")
      .select("title, price_bdt")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    title = data.title;
    basePrice = data.price_bdt ?? 0;
  }

  const price = effectivePriceBDT(basePrice, discount);
  const showDiscount = hasDiscount(basePrice, discount);
  const isFree = price <= 0;

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Checkout
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">
              Order summary
            </h2>
            <p className="mt-2 font-semibold text-foreground">{title}</p>
            <p className="text-xs capitalize text-muted-foreground">{type}</p>

            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-muted-foreground">Total</span>
              <span className="flex items-baseline gap-2">
                {showDiscount ? (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBDT(basePrice)}
                  </span>
                ) : null}
                <span className="text-2xl font-semibold text-foreground">
                  {formatBDT(price)}
                </span>
              </span>
            </div>
          </div>
        </aside>

        {/* Payment */}
        <div>
          {isFree ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                This one&apos;s on us
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This item is free — click below to get instant access. It will
                appear in your dashboard right away.
              </p>
              <div className="mt-6">
                <FreeEnrollButton type={type} id={id} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* bKash instructions */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-2 text-primary">
                  <Smartphone className="size-5" />
                  <h2 className="font-semibold">Pay with bKash</h2>
                </div>
                {settings ? (
                  <>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Open bKash → <strong className="text-foreground">Send Money</strong>{" "}
                      to:
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-wide text-foreground">
                      {settings.bkash_number}
                    </p>
                    {settings.instructions ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {settings.instructions}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Payment details are being configured. Please check back
                    shortly or contact support.
                  </p>
                )}
              </div>

              {/* Submission form */}
              {settings ? (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
                  <h2 className="font-semibold text-foreground">
                    Submit your payment details
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    Your details are private and reviewed by an admin.
                  </p>
                  <div className="mt-5">
                    <CheckoutForm
                      type={type}
                      id={id}
                      amount={price}
                      userId={user.id}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Changed your mind?{" "}
            <Link
              href={type === "program" ? "/programs" : "/resources"}
              className="text-primary hover:underline"
            >
              Keep browsing
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
