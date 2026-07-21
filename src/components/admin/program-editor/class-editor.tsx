"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ExternalLink,
  MoreVertical,
  Copy,
  Trash2,
  Upload,
  Loader2,
  Play,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/browser";
import { RichTextEditor } from "./rich-text-editor";
import { ResourceManager } from "./resource-manager";
import { QuizManager } from "./quiz-manager";
import type { ClassItem, ClassStatus, Question, Resource, SaveFn } from "./types";

function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export function ClassEditor({
  cls,
  label,
  programSlug,
  onPatch,
  onResourcesChange,
  onQuestionsChange,
  onDuplicate,
  onDelete,
  onSaveChanges,
  save,
}: {
  cls: ClassItem;
  label: string;
  programSlug: string;
  onPatch: (patch: Partial<ClassItem>) => void;
  onResourcesChange: (resources: Resource[]) => void;
  onQuestionsChange: (questions: Question[]) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveChanges: () => void;
  save: SaveFn;
}) {
  const [uploading, setUploading] = useState(false);
  const ytId = youtubeId(cls.video_url);
  const thumb = cls.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  async function onThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `thumbnails/${cls.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
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
    onPatch({ thumbnail_url: publicUrl });
    setUploading(false);
    toast.success("Thumbnail updated.");
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Editing: <span className="font-semibold text-primary">{label}</span>
          </p>
          <h3 className="truncate text-lg font-semibold text-foreground">{cls.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/programs/${programSlug}`} target="_blank">
              <ExternalLink className="size-4" />
              Preview
            </Link>
          </Button>
          <Button size="sm" onClick={onSaveChanges}>
            <Save className="size-4" />
            Save Changes
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="size-4" />
                Duplicate class
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="basic" className="p-4">
        <TabsList variant="line" className="mb-4 flex-wrap">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="quiz">Quiz (Q&amp;A)</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="cls-title">Class Title *</Label>
                <Input
                  id="cls-title"
                  value={cls.title}
                  onChange={(e) => onPatch({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cls-video">YouTube Video Link *</Label>
                <Input
                  id="cls-video"
                  value={cls.video_url ?? ""}
                  onChange={(e) => onPatch({ video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
                <p className="text-xs text-muted-foreground">
                  Add the YouTube link of this class video.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <Play className="size-8" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <label
                  htmlFor="cls-thumb"
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Change Thumbnail
                </label>
                <input
                  id="cls-thumb"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onThumb}
                />
                {cls.thumbnail_url ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-9 text-destructive hover:bg-destructive/10"
                    onClick={() => onPatch({ thumbnail_url: null })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            Make sure the YouTube video is public or unlisted.
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={cls.status}
                onValueChange={(v) => onPatch({ status: v as ClassStatus })}
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
            <div className="space-y-1">
              <Label htmlFor="cls-duration">Duration (minutes)</Label>
              <Input
                id="cls-duration"
                type="number"
                min={0}
                value={cls.duration_seconds ? Math.round(cls.duration_seconds / 60) : ""}
                onChange={(e) => {
                  const mins = Number(e.target.value);
                  onPatch({ duration_seconds: mins > 0 ? mins * 60 : null });
                }}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch
                id="cls-preview"
                checked={cls.is_preview}
                onCheckedChange={(v) => onPatch({ is_preview: v })}
              />
              <Label htmlFor="cls-preview">Free preview</Label>
            </div>
          </div>
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Overview Content</h4>
            <p className="mb-2 text-xs text-muted-foreground">
              What will students learn in this class?
            </p>
          </div>
          <RichTextEditor
            key={cls.id}
            initialHtml={cls.overview_html ?? ""}
            onChange={(html) => onPatch({ overview_html: html })}
          />
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources">
          <ResourceManager
            lessonId={cls.id}
            resources={cls.resources}
            onChange={onResourcesChange}
            save={save}
          />
        </TabsContent>

        {/* Quiz */}
        <TabsContent value="quiz">
          <QuizManager
            lessonId={cls.id}
            questions={cls.questions}
            onChange={onQuestionsChange}
            save={save}
          />
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Notes for Students</h4>
            <p className="mb-2 text-xs text-muted-foreground">
              Add instructions, homework, or reminders for this class.
            </p>
          </div>
          <Textarea
            rows={5}
            value={cls.admin_notes ?? ""}
            onChange={(e) => onPatch({ admin_notes: e.target.value })}
            placeholder="Please watch the full video and go through the resources. Attempt the quiz after completing the class."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
