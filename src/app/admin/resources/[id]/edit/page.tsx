import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { ResourceForm } from "@/components/admin/resource-form";
import type { ResourceInput } from "@/features/admin/resource-actions";

export const metadata: Metadata = { title: "Edit resource" };

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!resource) notFound();

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
        Edit resource
      </h1>
      <ResourceForm
        initial={{
          id: resource.id,
          title: resource.title,
          slug: resource.slug,
          author: resource.author ?? "",
          kind: resource.kind as ResourceInput["kind"],
          description: resource.description ?? "",
          price_bdt: Number(resource.price_bdt ?? 0),
          file_storage_path: resource.file_storage_path,
          is_featured: resource.is_featured ?? false,
          is_premium: resource.is_premium ?? false,
        }}
      />
    </div>
  );
}
