import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-guard";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";

export const metadata: Metadata = { title: "Payment Settings" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Payment Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          The bKash number and instructions shown to students at checkout.
        </p>
      </div>

      <PaymentSettingsForm
        initial={{
          id: settings?.id,
          label: settings?.label ?? "bKash",
          bkash_number: settings?.bkash_number ?? "",
          instructions: settings?.instructions ?? "",
          is_active: settings?.is_active ?? true,
        }}
      />
    </div>
  );
}
