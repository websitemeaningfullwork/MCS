"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { FacebookIcon, YoutubeIcon } from "@/components/shared/social-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TagInput } from "@/components/admin/tag-input";
import { createClient } from "@/lib/supabase/browser";
import { saveMentor } from "@/features/admin/mentor-actions";
import {
  WEEKDAYS,
  SESSION_DURATIONS,
  mentorStatuses,
  type Availability,
  type MentorStatus,
  type Weekday,
} from "@/features/admin/mentor-schema";
import { cn } from "@/lib/utils";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const BIO_MAX = 600;

export type MentorEditorInitial = {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  avatar_url: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  show_phone: boolean;
  show_whatsapp: boolean;
  show_email: boolean;
  expertise: string[];
  skills: string[];
  years_experience: number;
  highest_qualification: string;
  current_position: string;
  organization: string;
  availability: Availability;
  session_duration: number | null;
  session_price_bdt: number;
  currency: string;
  facebook_url: string;
  youtube_url: string;
  linkedin_url: string;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  sort_order: number;
  status: MentorStatus;
};

export function MentorForm({ initial }: { initial: MentorEditorInitial }) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initial.full_name);
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url);
  const [uploading, setUploading] = useState(false);

  const [phone, setPhone] = useState(initial.phone);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [email, setEmail] = useState(initial.email);
  const [showPhone, setShowPhone] = useState(initial.show_phone);
  const [showWhatsapp, setShowWhatsapp] = useState(initial.show_whatsapp);
  const [showEmail, setShowEmail] = useState(initial.show_email);

  const [expertise, setExpertise] = useState<string[]>(initial.expertise);
  const [skills, setSkills] = useState<string[]>(initial.skills);

  const [years, setYears] = useState(String(initial.years_experience || ""));
  const [qualification, setQualification] = useState(initial.highest_qualification);
  const [position, setPosition] = useState(initial.current_position);
  const [organization, setOrganization] = useState(initial.organization);

  const [availability, setAvailability] = useState<Availability>(initial.availability);

  const [duration, setDuration] = useState<string>(String(initial.session_duration ?? 60));
  const [price, setPrice] = useState(String(initial.session_price_bdt || ""));
  const [currency, setCurrency] = useState(initial.currency || "BDT");

  const [facebook, setFacebook] = useState(initial.facebook_url);
  const [youtube, setYoutube] = useState(initial.youtube_url);
  const [linkedin, setLinkedin] = useState(initial.linkedin_url);

  const [featured, setFeatured] = useState(initial.is_featured);
  const [verified, setVerified] = useState(initial.is_verified);
  const [active, setActive] = useState(initial.is_active);
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order || 0));
  const [status, setStatus] = useState<MentorStatus>(initial.status);

  const [saving, setSaving] = useState(false);

  function toggleDay(day: Weekday) {
    setAvailability((a) => ({
      ...a,
      working_days: a.working_days.includes(day)
        ? a.working_days.filter((d) => d !== day)
        : [...a.working_days, day],
    }));
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Photo must be a PNG, JPEG, or WebP image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Photo is too large (max 5 MB).");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${initial.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Photo upload failed. Please try again.");
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

  async function handleSave() {
    if (fullName.trim().length < 2) {
      toast.error("Enter the mentor's full name.");
      return;
    }
    setSaving(true);
    const res = await saveMentor({
      id: initial.id,
      full_name: fullName,
      headline,
      bio,
      avatar_url: avatarUrl,
      phone,
      whatsapp,
      email,
      show_phone: showPhone,
      show_whatsapp: showWhatsapp,
      show_email: showEmail,
      expertise,
      skills,
      years_experience: Number(years) || 0,
      highest_qualification: qualification,
      current_position: position,
      organization,
      availability,
      session_duration: duration ? Number(duration) : null,
      session_price_bdt: Number(price) || 0,
      currency,
      facebook_url: facebook,
      youtube_url: youtube,
      linkedin_url: linkedin,
      is_featured: featured,
      is_verified: verified,
      is_active: active,
      sort_order: Number(sortOrder) || 0,
      status,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Mentor saved.");
    router.refresh();
  }

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Mentor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update mentor information, availability, pricing and other details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/mentors">
              <ArrowLeft className="size-4" />
              Back to Mentors
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Mentor
          </Button>
        </div>
      </div>

      {/* Top: three columns */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.2fr_1fr]">
        {/* Column A: Profile picture + expertise + professional */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Profile Picture
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex aspect-[4/3] items-center justify-center bg-secondary/40">
              <Avatar className="size-full rounded-none">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                ) : null}
                <AvatarFallback className="rounded-none bg-secondary text-3xl font-semibold text-muted-foreground">
                  {initials || "M"}
                </AvatarFallback>
              </Avatar>
            </div>
            <label
              htmlFor="mentor-avatar"
              className="flex cursor-pointer flex-col items-center gap-1 border-t border-border p-4 text-center transition-colors hover:bg-secondary/40"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                Click to upload or drag &amp; drop
              </span>
              <span className="text-xs text-muted-foreground">PNG, JPG or WebP (Max 5MB)</span>
            </label>
            <input
              id="mentor-avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={onAvatarChange}
              disabled={uploading}
            />
          </div>
          {avatarUrl ? (
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
            >
              <Trash2 className="size-4" />
              Remove Photo
            </button>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise <span className="text-muted-foreground">(Add multiple)</span></Label>
            <TagInput
              id="expertise"
              value={expertise}
              onChange={setExpertise}
              placeholder="Add expertise and press enter"
            />
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="years">Years of Experience</Label>
              <Input
                id="years"
                type="number"
                min={0}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="e.g. 7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Highest Qualification</Label>
              <Input
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. BSc in CSE, BUET"
              />
            </div>
          </div>
        </section>

        {/* Column B: Basic info + skills */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">
              Title / Headline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Career &amp; Life Coach"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">
                Short Bio <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {bio.length}/{BIO_MAX} characters
              </span>
            </div>
            <Textarea
              id="bio"
              rows={5}
              maxLength={BIO_MAX}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short introduction describing the mentor's expertise."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills <span className="text-muted-foreground">(Add multiple)</span></Label>
            <TagInput
              id="skills"
              value={skills}
              onChange={setSkills}
              placeholder="Add skills and press enter"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">Current Position</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Founder &amp; Mentor, MCA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </section>

        {/* Column C: Contact + visibility + social */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-foreground">Contact Information</h2>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number (Active) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1712-345678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">
              WhatsApp Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+880 1712-345678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com (Optional)"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">Visibility Settings</p>
                <p className="text-xs text-muted-foreground">Control what students can see.</p>
              </div>
            </div>
            <VisibilityRow
              label="Show Phone Number"
              hint="Students will see the phone number"
              checked={showPhone}
              onChange={setShowPhone}
            />
            <VisibilityRow
              label="Show WhatsApp Number"
              hint="Students will see the WhatsApp number"
              checked={showWhatsapp}
              onChange={setShowWhatsapp}
            />
            <VisibilityRow
              label="Show Email Address"
              hint="Students will see the email address"
              checked={showEmail}
              onChange={setShowEmail}
            />
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">Social Links</h3>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-1.5">
                <FacebookIcon className="size-4 text-[#1877F2]" /> Facebook Page
              </Label>
              <Input
                id="facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube" className="flex items-center gap-1.5">
                <YoutubeIcon className="size-4 text-[#FF0000]" /> YouTube Channel
              </Label>
              <Input
                id="youtube"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn (optional)</Label>
              <Input
                id="linkedin"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Bottom: availability + session & pricing */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Availability */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-foreground">Availability</h2>

          <div className="space-y-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const on = availability.working_days.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary/50",
                    )}
                    aria-pressed={on}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time</Label>
              <Input
                id="start"
                type="time"
                value={availability.start_time}
                onChange={(e) => setAvailability((a) => ({ ...a, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Time</Label>
              <Input
                id="end"
                type="time"
                value={availability.end_time}
                onChange={(e) => setAvailability((a) => ({ ...a, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Break Time <span className="text-muted-foreground">(Optional)</span></Label>
            <div className="space-y-2">
              {availability.breaks.map((br, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={br.start}
                    onChange={(e) =>
                      setAvailability((a) => {
                        const breaks = [...a.breaks];
                        breaks[i] = { ...breaks[i], start: e.target.value };
                        return { ...a, breaks };
                      })
                    }
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={br.end}
                    onChange={(e) =>
                      setAvailability((a) => {
                        const breaks = [...a.breaks];
                        breaks[i] = { ...breaks[i], end: e.target.value };
                        return { ...a, breaks };
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAvailability((a) => ({ ...a, breaks: a.breaks.filter((_, j) => j !== i) }))
                    }
                    aria-label="Remove break"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAvailability((a) => ({
                    ...a,
                    breaks: [...a.breaks, { start: "13:00", end: "14:00" }],
                  }))
                }
              >
                <Plus className="size-4" />
                Add Break Time
              </Button>
            </div>
          </div>
        </section>

        {/* Session & pricing */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-foreground">Session &amp; Pricing</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="duration">Session Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">
                Price ({currency}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">BDT (৳)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ToggleTile label="Featured Mentor" checked={featured} onChange={setFeatured} />
            <ToggleTile label="Verified Mentor" checked={verified} onChange={setVerified} />
            <ToggleTile label="Active Mentor" checked={active} onChange={setActive} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sort">Sort Order</Label>
              <Input
                id="sort"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Lower number will show first.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MentorStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {mentorStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>

      <p className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        Changes will be reflected on the website mentor listing and mentor details page.
      </p>
    </div>
  );
}

function VisibilityRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ToggleTile({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
