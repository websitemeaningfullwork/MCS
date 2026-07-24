"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Loader2,
  Plus,
  GripVertical,
  Pencil,
  Check,
  X,
  Star,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type {
  AssignedMentor,
  CategoryOption,
  Level,
  MentorOption,
  ProgramInfo,
  ProgramStatus,
  Season,
} from "./types";

const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "Beginner to Advanced",
};

export function ProgramInfoPanel({
  info,
  onPatchInfo,
  categories,
  seasons,
  activeSeasonId,
  onSelectSeason,
  onAddSeason,
  onUpdateSeason,
  onDeleteSeason,
  onReorderSeasons,
  mentorOptions,
  assignedMentors,
  onAssignMentor,
  onRemoveMentor,
  onSetPrimary,
}: {
  info: ProgramInfo;
  onPatchInfo: (patch: Partial<ProgramInfo>, opts?: { revalidate?: boolean }) => void;
  categories: CategoryOption[];
  seasons: Season[];
  activeSeasonId: string | null;
  onSelectSeason: (id: string) => void;
  onAddSeason: () => void;
  onUpdateSeason: (id: string, patch: { title?: string; subtitle?: string | null }) => void;
  onDeleteSeason: (id: string) => void;
  onReorderSeasons: (orderedIds: string[]) => void;
  mentorOptions: MentorOption[];
  assignedMentors: AssignedMentor[];
  onAssignMentor: (id: string) => void;
  onRemoveMentor: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState<string | null>(null);
  const [addingMentor, setAddingMentor] = useState(false);
  const [pickMentor, setPickMentor] = useState("");

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `covers/${info.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage
      .from("course-assets")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error("Upload failed.");
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(path);
    onPatchInfo({ cover_url: publicUrl }, { revalidate: true });
    setUploading(false);
    toast.success("Image updated.");
  }

  function handleSeasonDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = seasons.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorderSeasons(ids);
    setDragId(null);
  }

  const unassigned = mentorOptions.filter(
    (m) => !assignedMentors.some((a) => a.mentor_id === m.id),
  );

  // effectivePriceBDT() only applies discount_bdt when 0 < discount < price;
  // anything else is silently dropped back to the full price. Warn instead of
  // letting the admin believe a discount is live when it isn't.
  const discountIgnored = info.discount_bdt > 0 && info.discount_bdt >= info.price_bdt;

  return (
    <div className="space-y-6">
      {/* ---- Program Information ---- */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Program Information</h2>

        <div className="space-y-2">
          <Label>Program Image</Label>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
            {info.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.cover_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <label
              htmlFor="prog-cover"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Change Image
            </label>
            <input id="prog-cover" type="file" accept="image/*" className="sr-only" onChange={onCover} />
            {info.cover_url ? (
              <Button
                size="icon"
                variant="ghost"
                className="size-9 text-destructive hover:bg-destructive/10"
                onClick={() => onPatchInfo({ cover_url: null }, { revalidate: true })}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="prog-title">Program Title *</Label>
          <Input
            id="prog-title"
            value={info.title}
            onChange={(e) => onPatchInfo({ title: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prog-subtitle">Short Description</Label>
          <Input
            id="prog-subtitle"
            value={info.subtitle}
            onChange={(e) => onPatchInfo({ subtitle: e.target.value })}
            placeholder="A one-line summary."
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prog-desc">Description</Label>
          <Textarea
            id="prog-desc"
            rows={3}
            value={info.description}
            onChange={(e) => onPatchInfo({ description: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prog-trailer">YouTube Trailer Link</Label>
          <Input
            id="prog-trailer"
            value={info.preview_video_url}
            onChange={(e) => onPatchInfo({ preview_video_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </div>

        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            value={info.category_id ?? "none"}
            onValueChange={(v) => onPatchInfo({ category_id: v === "none" ? null : v }, { revalidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Level</Label>
            <Select value={info.level} onValueChange={(v) => onPatchInfo({ level: v as Level })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={info.status}
              onValueChange={(v) => onPatchInfo({ status: v as ProgramStatus }, { revalidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="prog-price">Regular price (BDT)</Label>
            <Input
              id="prog-price"
              type="number"
              min={0}
              value={info.price_bdt}
              onChange={(e) => onPatchInfo({ price_bdt: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            {/* Label used to read "Discount (BDT)", which reads as amount-off.
                discount_bdt is the FINAL price (see effectivePriceBDT), so an
                admin entering "500" meaning "৳500 off" a ৳5,000 course sold it
                for ৳500. Same wording as ProgramForm now. */}
            <Label htmlFor="prog-discount">Discounted price (BDT)</Label>
            <Input
              id="prog-discount"
              type="number"
              min={0}
              value={info.discount_bdt}
              onChange={(e) => onPatchInfo({ discount_bdt: Number(e.target.value) || 0 })}
              aria-describedby="prog-discount-help"
              aria-invalid={discountIgnored || undefined}
            />
            <p id="prog-discount-help" className="text-xs text-muted-foreground">
              The price students actually pay. Must be lower than the regular price.
              Leave 0 for no discount.
            </p>
            {discountIgnored ? (
              <p role="alert" className="text-xs font-medium text-warning">
                Not lower than the regular price — it will be ignored and students
                would still pay ৳{info.price_bdt.toLocaleString("en-US")}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="prog-featured"
            checked={info.is_featured}
            onCheckedChange={(v) => onPatchInfo({ is_featured: v }, { revalidate: true })}
          />
          <Label htmlFor="prog-featured">Featured Program</Label>
        </div>
      </div>

      {/* ---- Program Seasons ---- */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Program Seasons</h2>
          <Button size="sm" variant="ghost" onClick={onAddSeason}>
            <Plus className="size-4" />
            Add Season
          </Button>
        </div>

        {seasons.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No seasons yet. Add one to start building the curriculum.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {seasons.map((s, i) => (
              <li
                key={s.id}
                draggable={editingSeason !== s.id}
                onDragStart={() => setDragId(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleSeasonDrop(s.id)}
                className={cn(
                  "rounded-xl border px-2 py-2 transition-colors",
                  s.id === activeSeasonId
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-secondary/50",
                  dragId === s.id && "opacity-50",
                )}
              >
                {editingSeason === s.id ? (
                  <SeasonEditRow
                    season={s}
                    onSave={(patch) => {
                      onUpdateSeason(s.id, patch);
                      setEditingSeason(null);
                    }}
                    onCancel={() => setEditingSeason(null)}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => onSelectSeason(s.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={cn(
                          "block text-sm",
                          s.id === activeSeasonId ? "font-medium text-primary" : "text-foreground",
                        )}
                      >
                        Season {i + 1}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.subtitle || s.title}
                      </span>
                    </button>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {s.classes.length}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={() => setEditingSeason(s.id)}
                      aria-label="Edit season"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDeleteSeason(s.id)}
                      aria-label="Delete season"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- Mentors ---- */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Mentors</h2>
          {!addingMentor && unassigned.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setAddingMentor(true)}>
              <UserPlus className="size-4" />
              Add Mentor
            </Button>
          ) : null}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Manage mentors for this program.</p>

        {addingMentor ? (
          <div className="mb-3 flex gap-2">
            <Select value={pickMentor} onValueChange={setPickMentor}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a mentor" />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!pickMentor}
              onClick={() => {
                onAssignMentor(pickMentor);
                setPickMentor("");
                setAddingMentor(false);
              }}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingMentor(false);
                setPickMentor("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : null}

        {assignedMentors.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No mentors assigned yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {assignedMentors.map((a) => {
              const m = mentorOptions.find((o) => o.id === a.mentor_id);
              return (
                <li
                  key={a.mentor_id}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                    {m?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      (m?.name ?? "M").charAt(0)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <span className="truncate">{m?.name ?? "Mentor"}</span>
                      {a.is_primary ? (
                        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                          <Star className="size-3" /> Primary
                        </Badge>
                      ) : null}
                    </p>
                    {m?.headline ? (
                      <p className="truncate text-xs text-muted-foreground">{m.headline}</p>
                    ) : null}
                  </div>
                  {!a.is_primary ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={() => onSetPrimary(a.mentor_id)}
                      aria-label="Make primary mentor"
                      title="Make primary"
                    >
                      <Star className="size-3.5" />
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemoveMentor(a.mentor_id)}
                    aria-label="Remove mentor"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SeasonEditRow({
  season,
  onSave,
  onCancel,
}: {
  season: Season;
  onSave: (patch: { title: string; subtitle: string | null }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(season.title);
  const [subtitle, setSubtitle] = useState(season.subtitle ?? "");
  return (
    <div className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Season title"
        className="h-8"
      />
      <Input
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Subtitle (optional)"
        className="h-8"
      />
      <div className="flex justify-end gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-success"
          disabled={!title.trim()}
          onClick={() => onSave({ title: title.trim(), subtitle: subtitle.trim() || null })}
          aria-label="Save season"
        >
          <Check className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" className="size-7" onClick={onCancel} aria-label="Cancel">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
