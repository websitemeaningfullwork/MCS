import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { MockTestForm } from "@/components/admin/mock-test-form";

export const metadata: Metadata = { title: "New mock test" };

export default async function NewMockTestPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mock-tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to mock tests
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New mock test
      </h1>
      <MockTestForm categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
