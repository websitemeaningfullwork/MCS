import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { LiveClassForm } from "@/components/admin/live-class-form";

export const metadata: Metadata = { title: "Edit live class" };

export default async function EditLiveClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: lc } = await supabase
    .from("live_classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!lc) notFound();

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
        Edit live class
      </h1>
      <LiveClassForm
        initial={{
          id: lc.id,
          title: lc.title,
          description: lc.description ?? "",
          starts_at: new Date(lc.starts_at).toISOString().slice(0, 16),
          meeting_url: lc.meeting_url ?? "",
          replay_url: lc.replay_url ?? "",
          is_public: lc.is_public ?? true,
        }}
      />
    </div>
  );
}
