import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteMockTest } from "@/features/admin/mock-test-actions";

export const metadata: Metadata = { title: "Mock tests admin" };

export default async function AdminMockTestsPage() {
  const { supabase } = await requireAdmin();
  const { data: tests } = await supabase
    .from("mock_tests")
    .select("id, title, slug, test_type, is_free")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Mock Tests
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/admin/mock-tests/new">
            <Plus className="size-4" />
            New test
          </Link>
        </Button>
      </div>

      {!tests || tests.length === 0 ? (
        <EmptyState title="No tests" description="Create your first mock test." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {tests.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{t.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {t.test_type} · /{t.slug}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {t.is_free ? <Badge variant="secondary">Free</Badge> : null}
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/mock-tests/${t.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteButton id={t.id} onDelete={deleteMockTest} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
