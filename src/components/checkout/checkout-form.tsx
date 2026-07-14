"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";
import { submitManualPayment } from "@/features/payments/actions";
import { manualPaymentSchema } from "@/features/payments/schemas";
import { cn } from "@/lib/utils";

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
  const [dragging, setDragging] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { sender_number: "", transaction_id: "", paid_amount_bdt: amount },
  });

  function acceptFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    if (!ALLOWED_SCREENSHOT_TYPES.includes(next.type)) {
      toast.error("Screenshot must be a PNG, JPG, JPEG, or WEBP image.");
      return;
    }
    if (next.size > MAX_SCREENSHOT_BYTES) {
      toast.error("Screenshot is too large (max 5 MB).");
      return;
    }
    setFile(next);
  }

  async function onSubmit(values: FormValues) {
    let uploadedPath: string | undefined;

    if (file) {
      // The screenshot is optional: if the upload fails we still submit the
      // payment (without it) rather than blocking checkout.
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="sender_number">Your bKash number (sender)</Label>
        <Input
          id="sender_number"
          inputMode="numeric"
          placeholder="01XXXXXXXXX"
          className="h-11 rounded-xl"
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transaction_id">Transaction ID (TrxID)</Label>
          <Input
            id="transaction_id"
            placeholder="e.g. 9AB1C2D3E4"
            className="h-11 rounded-xl"
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
            className="h-11 rounded-xl"
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="screenshot">Payment screenshot (optional)</Label>

        {file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove screenshot"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="screenshot"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="size-6" />
            </span>
            <span className="text-sm font-medium text-foreground">
              Drag &amp; drop, or click to upload
            </span>
            <span className="text-xs text-muted-foreground">
              PNG, JPG, JPEG, or WEBP · up to 5 MB
            </span>
          </label>
        )}

        <input
          id="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-6 text-base shadow-lg shadow-blue-600/25 transition-shadow hover:shadow-xl hover:shadow-blue-600/40"
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
        Submit Payment for Verification
        {!isSubmitting ? <ArrowRight className="size-4" /> : null}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Payments are manually verified within 24 hours.
      </p>
    </form>
  );
}
