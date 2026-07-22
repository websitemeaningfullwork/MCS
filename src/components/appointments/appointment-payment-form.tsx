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
import { submitAppointmentPayment } from "@/features/appointments/actions";
import { cn } from "@/lib/utils";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

const formSchema = z.object({
  sender_number: z.string().min(6, "Enter the bKash number you sent from."),
  transaction_id: z.string().min(4, "Enter the bKash transaction ID."),
  paid_amount_bdt: z.number().positive("Enter the amount you paid."),
});
type FormValues = z.infer<typeof formSchema>;

function screenshotPath(userId: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "png";
  return `${userId}/appt-${crypto.randomUUID()}.${ext}`;
}

export function AppointmentPaymentForm({
  appointmentId,
  amount,
  userId,
}: {
  appointmentId: string;
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
      toast.error("Screenshot must be a PNG, JPG, or WebP image.");
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
      const supabase = createClient();
      const path = screenshotPath(userId, file.name);
      const { error } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error("Screenshot upload failed. Please try again.");
        return;
      }
      uploadedPath = path;
    }

    const res = await submitAppointmentPayment({
      appointment_id: appointmentId,
      sender_number: values.sender_number,
      transaction_id: values.transaction_id,
      paid_amount_bdt: values.paid_amount_bdt,
      screenshot_path: uploadedPath,
    });
    // On success the action redirects; only errors return here.
    if (res?.error) toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sender_number">Your bKash Number</Label>
        <Input id="sender_number" placeholder="01XXXXXXXXX" {...register("sender_number")} />
        {errors.sender_number ? (
          <p className="text-sm text-destructive">{errors.sender_number.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_id">Transaction ID (TrxID)</Label>
        <Input id="transaction_id" placeholder="e.g. 9GH42KLM01" {...register("transaction_id")} />
        {errors.transaction_id ? (
          <p className="text-sm text-destructive">{errors.transaction_id.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paid_amount_bdt">Amount Paid (৳)</Label>
        <Input
          id="paid_amount_bdt"
          type="number"
          step="1"
          {...register("paid_amount_bdt", { valueAsNumber: true })}
        />
        {errors.paid_amount_bdt ? (
          <p className="text-sm text-destructive">{errors.paid_amount_bdt.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Payment Screenshot (optional)</Label>
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
            <ImageIcon className="size-5 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove screenshot"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
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
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed p-5 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40",
            )}
          >
            <UploadCloud className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Drag &amp; drop or click to upload
            </span>
            <span className="text-xs text-muted-foreground">PNG, JPG or WebP (max 5MB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit for Verification
        <ArrowRight className="size-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your booking is confirmed once an admin verifies the payment.
      </p>
    </form>
  );
}
