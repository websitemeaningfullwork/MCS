import { QrCode, ShieldCheck, Smartphone } from "lucide-react";

import { CopyNumberButton } from "@/components/checkout/copy-number-button";

/**
 * Payment-method card — bKash only, pink confined here (design rule). Shared by
 * the course checkout and the appointment payment page so both read identically.
 * When `settings` is null the card explains payment is being configured.
 */
export function BkashCard({
  settings,
}: {
  settings: { bkash_number: string; instructions?: string | null } | null;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-pink-500/20 bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-pink-500/5 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#e2136e]/10 text-[#e2136e]">
            <Smartphone className="size-5" />
          </span>
          <h2 className="font-semibold text-foreground">Payment Method</h2>
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
            <span className="text-sm text-muted-foreground">Send Money</span>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Payment Number</p>
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
              <span className="text-xs text-muted-foreground">Scan &amp; Pay</span>
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
            Payment details are being configured. Please check back shortly or contact
            support.
          </p>
        </div>
      )}
    </section>
  );
}
