"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileCheck } from "lucide-react";

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
import { createClient } from "@/lib/supabase/browser";
import { saveResource, type ResourceInput } from "@/features/admin/resource-actions";
import { slugify } from "@/lib/slug";
import { RESOURCE_KIND_LABELS } from "@/components/marketing/resource-card";

type Kind = ResourceInput["kind"];

// Must match the `resource-files` storage bucket limits (migration 006).
const MAX_RESOURCE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_RESOURCE_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "application/zip",
];

export function ResourceForm({
  initial,
}: {
  initial?: {
    id: string;
    title: string;
    slug: string;
    author: string;
    kind: Kind;
    description: string;
    price_bdt: number;
    file_storage_path: string | null;
    is_featured: boolean;
    is_premium: boolean;
  };
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "ebook");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price_bdt ?? 0));
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [premium, setPremium] = useState(initial?.is_premium ?? false);
  const [filePath, setFilePath] = useState<string | null>(
    initial?.file_storage_path ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate before upload so the admin gets a clear message rather than a
    // cryptic storage rejection from the bucket's size/MIME limits.
    if (file.type && !ALLOWED_RESOURCE_TYPES.includes(file.type)) {
      toast.error("File must be a PDF, EPUB, or ZIP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_RESOURCE_BYTES) {
      toast.error("File is too large (max 25 MB).");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage
      .from("resource-files")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error("File upload failed.");
      setUploading(false);
      return;
    }
    setFilePath(path);
    setUploading(false);
    toast.success("File uploaded — save to apply.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await saveResource({
      id: initial?.id,
      title,
      slug: slug.trim() || slugify(title),
      author,
      kind,
      description,
      price_bdt: Number(price) || 0,
      file_storage_path: filePath ?? undefined,
      is_featured: featured,
      is_premium: premium,
    });
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    // redirects on success
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!initial) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Kind</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RESOURCE_KIND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (BDT, 0 = free)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">File (PDF)</Label>
          <label
            htmlFor="file"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : filePath ? (
              <FileCheck className="size-4 text-success" />
            ) : (
              <Upload className="size-4" />
            )}
            {filePath ? "File attached" : "Upload file"}
          </label>
          <input
            id="file"
            type="file"
            accept="application/pdf,application/epub+zip,application/zip,.pdf,.epub,.zip"
            className="sr-only"
            onChange={onFile}
          />
          <p className="text-xs text-muted-foreground">PDF, EPUB, or ZIP · up to 25 MB</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
          <Label htmlFor="featured">Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={premium} onCheckedChange={setPremium} id="premium" />
          <Label htmlFor="premium">Premium</Label>
        </div>
      </div>

      <Button type="submit" disabled={loading || uploading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {initial ? "Save resource" : "Create resource"}
      </Button>
    </form>
  );
}
