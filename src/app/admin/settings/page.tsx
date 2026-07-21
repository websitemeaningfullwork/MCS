import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import { WhatsappSettingsForm } from "@/components/admin/whatsapp-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: payment }, { data: site }] = await Promise.all([
    supabase
      .from("payment_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("site_settings").select("*").eq("id", "global").maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Website Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Control site-wide options. Changes go live immediately — no redeploy.
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The floating WhatsApp support button shown to visitors across the site.
          </p>
          <WhatsappSettingsForm
            initial={{
              enabled: site?.whatsapp_enabled ?? false,
              connection:
                site?.whatsapp_connection === "link" ? "link" : "number",
              number: site?.whatsapp_number ?? "",
              link: site?.whatsapp_link ?? "",
              message:
                site?.whatsapp_message ??
                "Hello! I want to know more about MCA.",
              position:
                site?.whatsapp_position === "bottom-left"
                  ? "bottom-left"
                  : "bottom-right",
              size:
                site?.whatsapp_size === "sm" || site?.whatsapp_size === "lg"
                  ? site.whatsapp_size
                  : "md",
              animation: site?.whatsapp_animation ?? true,
            }}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The bKash number and instructions shown to students at checkout.
          </p>
          <PaymentSettingsForm
            initial={{
              id: payment?.id,
              label: payment?.label ?? "bKash",
              bkash_number: payment?.bkash_number ?? "",
              instructions: payment?.instructions ?? "",
              is_active: payment?.is_active ?? true,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
