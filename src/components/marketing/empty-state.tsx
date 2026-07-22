import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { T } from "@/components/shared/t";

export function EmptyState({
  title = <T en="Nothing here yet" bn="এখনও কিছু নেই" />,
  description = <T en="Try adjusting your search or filters." bn="সার্চ বা ফিল্টার বদলে আবার চেষ্টা করুন।" />,
}: {
  title?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <SearchX className="size-8 text-muted-foreground" />
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
