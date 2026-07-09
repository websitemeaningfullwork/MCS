"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/browser";
import { updateProfile } from "@/features/profile/actions";

const formSchema = z.object({
  full_name: z.string().min(2, "Please enter your name."),
  bio: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function SettingsForm({
  userId,
  initialName,
  initialBio,
  initialAvatar,
  email,
}: {
  userId: string;
  initialName: string;
  initialBio: string;
  initialAvatar: string | null;
  email: string;
}) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { full_name: initialName, bio: initialBio },
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Avatar upload failed. Please try again.");
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast.success("Photo uploaded — save to apply.");
  }

  async function onSubmit(values: FormValues) {
    const res = await updateProfile({
      ...values,
      avatar_url: avatarUrl ?? undefined,
    });
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile updated.");
    router.refresh();
  }

  const initials = initialName
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card"
      noValidate
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
          <AvatarFallback className="bg-secondary text-lg font-semibold text-foreground">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <label
            htmlFor="avatar"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Change photo
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onAvatarChange}
            disabled={uploading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name ? (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} placeholder="Tell us about yourself…" {...register("bio")} />
        {errors.bio ? (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting || uploading}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
