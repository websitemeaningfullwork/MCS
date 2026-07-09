"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/features/contact/actions";
import { contactSchema, type ContactInput } from "@/features/contact/schemas";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactInput) {
    const res = await submitContact(values);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Message sent — we'll get back to you soon.");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-9 text-success" />
        <h2 className="mt-3 text-lg font-semibold text-foreground">
          Thanks for reaching out!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ve received your message and will reply to your email soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="name-error" role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="contact-email-error" role="alert" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="How can we help?"
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          {...register("subject")}
        />
        {errors.subject ? (
          <p id="subject-error" role="alert" className="text-sm text-destructive">
            {errors.subject.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={5}
          placeholder="Tell us a little more…"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {errors.message ? (
          <p id="message-error" role="alert" className="text-sm text-destructive">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Send message
      </Button>
    </form>
  );
}
