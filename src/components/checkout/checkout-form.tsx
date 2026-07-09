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

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Build a per-user screenshot path. Module-scoped so the random id is not
 *  treated as an impure call during component render. */
function screenshotPath(userId: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "png";
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

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
    let uploadedPath: string | undefined;

    if (file) {
      // The screenshot is optional: validate it, and if the upload fails we
      // still submit the payment (without it) rather than blocking checkout.
      if (!ALLOWED_SCREENSHOT_TYPES.includes(file.type)) {
        toast.error("Screenshot must be a PNG, JPEG, or WebP image.");
        return;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        toast.error("Screenshot is too large (max 5 MB).");
        return;
      }
      const supabase = createClient();
      const path = screenshotPath(userId, file.name);
      const { error } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { upsert: false });
      if (error) {
        toast.warning("Screenshot upload failed — submitting without it.");
      } else {
        uploadedPath = path;
      }
    }

    const res = await submitManualPayment({
      type,
      id,
      ...values,
      screenshot_path: uploadedPath,
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
          aria-invalid={errors.sender_number ? true : undefined}
          aria-describedby={errors.sender_number ? "sender_number-error" : undefined}
          {...register("sender_number")}
        />
        {errors.sender_number ? (
          <p id="sender_number-error" role="alert" className="text-sm text-destructive">
            {errors.sender_number.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_id">Transaction ID (TrxID)</Label>
        <Input
          id="transaction_id"
          placeholder="e.g. 9AB1C2D3E4"
          aria-invalid={errors.transaction_id ? true : undefined}
          aria-describedby={errors.transaction_id ? "transaction_id-error" : undefined}
          {...register("transaction_id")}
        />
        {errors.transaction_id ? (
          <p id="transaction_id-error" role="alert" className="text-sm text-destructive">
            {errors.transaction_id.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paid_amount_bdt">Amount paid (BDT)</Label>
        <Input
          id="paid_amount_bdt"
          type="number"
          step="1"
          aria-invalid={errors.paid_amount_bdt ? true : undefined}
          aria-describedby={errors.paid_amount_bdt ? "paid_amount_bdt-error" : undefined}
          {...register("paid_amount_bdt", { valueAsNumber: true })}
        />
        {errors.paid_amount_bdt ? (
          <p id="paid_amount_bdt-error" role="alert" className="text-sm text-destructive">
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
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>PNG, JPEG, or WebP · up to 5 MB</span>
          {file ? (
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setFile(null)}
            >
              Remove
            </button>
          ) : null}
        </div>
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
