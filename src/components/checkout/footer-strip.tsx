import { BadgeCheck, Lock, ShieldCheck, Zap } from "lucide-react";

/** Thin trust strip. Green icons = trust signal only (design rule). */
const FOOTER_STRIP = [
  { label: "SSL Secured", icon: Lock },
  { label: "100% Safe Payment", icon: ShieldCheck },
  { label: "Manual Verification", icon: BadgeCheck },
  { label: "Fast Confirmation", icon: Zap },
] as const;

export function TrustFooterStrip({ className }: { className?: string }) {
  return (
    <section
      className={
        "flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-3xl border border-border bg-card px-6 py-5 shadow-card" +
        (className ? ` ${className}` : "")
      }
    >
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
  );
}
