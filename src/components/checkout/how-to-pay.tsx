import {
  BadgeDollarSign,
  CheckCircle2,
  Copy,
  Hash,
  Send,
  Smartphone,
  Upload,
} from "lucide-react";

/**
 * "How to Pay with bKash" — 7 premium cards, each with its OWN accent colour
 * (design rule: never one colour). Titles/colours follow the checkout spec
 * exactly. Pure/static so both checkout and appointment payment can render it.
 */
const PAY_STEPS = [
  {
    title: "Open bKash",
    detail: "Launch the bKash app on your phone.",
    icon: Smartphone,
    tint: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    badge: "bg-pink-600",
  },
  {
    title: "Tap Payment",
    detail: "Choose Send Money on the bKash menu.",
    icon: Send,
    tint: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    badge: "bg-orange-500",
  },
  {
    title: "Enter Payment Number",
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
    title: "Complete Payment",
    detail: "Confirm the payment with your PIN.",
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

export function HowToPay() {
  return (
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
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="text-xs leading-snug text-muted-foreground">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
