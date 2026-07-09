import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin-guard";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { EmptyState } from "@/components/marketing/empty-state";
import type { Enums } from "@/types/database.types";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q } = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("email", `%${q}%`);
  const { data: users } = await query;
  const list = users ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Users
      </h1>

      <form className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email…"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </form>

      {list.length === 0 ? (
        <EmptyState title="No users" description="Registered users will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/40">
                  <td className="p-4 font-medium text-foreground">
                    {u.full_name ?? "—"}
                  </td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4">
                    <UserRoleSelect
                      userId={u.id}
                      role={(u.role ?? "student") as Enums<"user_role">}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
