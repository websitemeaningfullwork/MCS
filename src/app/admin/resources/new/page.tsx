import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { ResourceForm } from "@/components/admin/resource-form";

export const metadata: Metadata = { title: "New resource" };

export default async function NewResourcePage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <Link
        href="/admin/resources"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to resources
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New resource
      </h1>
      <ResourceForm />
    </div>
  );
}
