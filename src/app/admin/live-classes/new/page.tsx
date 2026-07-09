import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { LiveClassForm } from "@/components/admin/live-class-form";

export const metadata: Metadata = { title: "New live class" };

export default async function NewLiveClassPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <Link
        href="/admin/live-classes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to live classes
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New live class
      </h1>
      <LiveClassForm />
    </div>
  );
}
