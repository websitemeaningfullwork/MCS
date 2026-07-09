"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { submitManualPayment } from "@/features/payments/actions";
import { manualPaymentSchema } from "@/features/payments/schemas";

const formSchema = manualPaymentSchema
  .pick({ sender_number: true, transaction_id: true })
  .extend({ paid_amount_bdt: z.number().positive("Enter the amount you paid.") });
type FormValues = z.infer<typeof formSchema>;

export function CheckoutForm({
  type,
  id,
  amount,
  userId,
}: {
  type: "program" | "resource";
  id: string;
  amount: number;
  userId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { sender_number: "", transaction_id: "", paid_amount_bdt: amount },
  });

  async function onSubmit(values: FormValues) {
    let screenshotPath: string | undefined;

    if (file) {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { upsert: false });
      if (error) {
        toast.error("Screenshot upload failed — you can submit without it.");
        return;
      }
      screenshotPath = path;
    }

    const res = await submitManualPayment({
      type,
      id,
      ...values,
      screenshot_path: screenshotPath,
    });
    // On success the server action redirects; only errors return here.
    if (res?.error) toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="sender_number">Your bKash number (sender)</Label>
        <Input
          id="sender_number"
          inputMode="numeric"
          placeholder="01XXXXXXXXX"
          {...register("sender_number")}
        />
        {errors.sender_number ? (
          <p className="text-sm text-destructive">{errors.sender_number.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_id">Transaction ID (TrxID)</Label>
        <Input
          id="transaction_id"
          placeholder="e.g. 9AB1C2D3E4"
          {...register("transaction_id")}
        />
        {errors.transaction_id ? (
          <p className="text-sm text-destructive">{errors.transaction_id.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paid_amount_bdt">Amount paid (BDT)</Label>
        <Input
          id="paid_amount_bdt"
          type="number"
          step="1"
          {...register("paid_amount_bdt", { valueAsNumber: true })}
        />
        {errors.paid_amount_bdt ? (
          <p className="text-sm text-destructive">
            {errors.paid_amount_bdt.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="screenshot">Screenshot (optional)</Label>
        <label
          htmlFor="screenshot"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40"
        >
          <Upload className="size-4" />
          {file ? file.name : "Upload payment screenshot"}
        </label>
        <input
          id="screenshot"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit payment for verification
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We verify manually, usually within 24 hours.
      </p>
    </form>
  );
}
