import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { MentorCreateForm } from "@/components/admin/mentor-create-form";

export const metadata: Metadata = { title: "New mentor" };

export default async function NewMentorPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <Link
        href="/admin/mentors"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to mentors
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        New mentor
      </h1>
      <MentorCreateForm />
    </div>
  );
}
