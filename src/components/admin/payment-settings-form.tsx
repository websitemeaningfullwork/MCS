"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { savePaymentSettings } from "@/features/admin/settings-actions";

export function PaymentSettingsForm({
  initial,
}: {
  initial: {
    id?: string;
    label: string;
    bkash_number: string;
    instructions: string;
    is_active: boolean;
  };
}) {
  const router = useRouter();
  const [label, setLabel] = useState(initial.label);
  const [number, setNumber] = useState(initial.bkash_number);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [active, setActive] = useState(initial.is_active);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await savePaymentSettings({
      id: initial.id,
      label,
      bkash_number: number,
      instructions,
      is_active: active,
    });
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    toast.success("Payment settings saved.");
    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">bKash number</Label>
        <Input
          id="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="01XXXXXXXXX"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          rows={4}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Active</p>
          <p className="text-xs text-muted-foreground">
            Show this number on checkout.
          </p>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  );
}
