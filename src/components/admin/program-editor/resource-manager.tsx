"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, ExternalLink, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/browser";
import {
  createResource,
  updateResource,
  deleteResource,
} from "@/features/admin/program-editor-actions";
import {
  RESOURCE_TYPE_LABELS,
  type Resource,
  type ResourceType,
  type SaveFn,
} from "./types";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

function typeFromName(name: string): ResourceType {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  if (ext === "zip") return "zip";
  return "other";
}

type Draft = {
  id: string | null;
  title: string;
  type: ResourceType;
  file_url: string | null;
  external_url: string;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  type: "link",
  file_url: null,
  external_url: "",
};

export function ResourceManager({
  lessonId,
  resources,
  onChange,
  save,
}: {
  lessonId: string;
  resources: Resource[];
  onChange: (resources: Resource[]) => void;
  save: SaveFn;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const isLink = draft?.type === "link" || draft?.type === "drive";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is too large (max 25 MB).");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `resources/${lessonId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage
      .from("course-assets")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error("File upload failed.");
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(path);
    setDraft({
      ...draft,
      file_url: publicUrl,
      type: draft.type === "link" || draft.type === "drive" ? typeFromName(file.name) : draft.type,
      title: draft.title || file.name.replace(/\.[^.]+$/, ""),
    });
    setUploading(false);
    toast.success("File uploaded.");
  }

  async function submit() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Enter a resource title.");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      type: draft.type,
      file_url: isLink ? null : draft.file_url,
      external_url: isLink ? draft.external_url.trim() || null : null,
    };
    setBusy(true);
    if (draft.id) {
      const ok = await save(() => updateResource(draft.id!, payload));
      if (ok) {
        onChange(
          resources.map((r) =>
            r.id === draft.id
              ? { ...r, ...payload, file_url: payload.file_url, external_url: payload.external_url }
              : r,
          ),
        );
        setDraft(null);
      }
    } else {
      let created: Resource | null = null;
      const ok = await save(async () => {
        const res = await createResource(lessonId, payload);
        if (res.data) created = res.data as Resource;
        return res;
      });
      if (ok && created) {
        onChange([...resources, created]);
        setDraft(null);
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    const ok = await save(() => deleteResource(id));
    if (ok) onChange(resources.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Resources</h4>
          <p className="text-xs text-muted-foreground">
            Add study materials, files, or useful links.
          </p>
        </div>
        {!draft ? (
          <Button size="sm" variant="outline" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            <Plus className="size-4" />
            Add Resource
          </Button>
        ) : null}
      </div>

      {resources.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Link / File</th>
                <th className="px-3 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resources.map((r) => {
                const url = r.external_url || r.file_url;
                return (
                  <tr key={r.id} className="text-foreground">
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {RESOURCE_TYPE_LABELS[r.type]}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {r.file_url ? <FileText className="size-3.5" /> : <ExternalLink className="size-3.5" />}
                          <span className="truncate">{url}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() =>
                            setDraft({
                              id: r.id,
                              title: r.title,
                              type: r.type,
                              file_url: r.file_url,
                              external_url: r.external_url ?? "",
                            })
                          }
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => remove(r.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !draft ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          No resources yet.
        </p>
      ) : null}

      {draft ? (
        <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <div className="space-y-1">
              <Label htmlFor="res-title">Title</Label>
              <Input
                id="res-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Admission Guide PDF"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => setDraft({ ...draft, type: v as ResourceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLink ? (
            <div className="space-y-1">
              <Label htmlFor="res-url">Link URL</Label>
              <Input
                id="res-url"
                value={draft.external_url}
                onChange={(e) => setDraft({ ...draft, external_url: e.target.value })}
                placeholder="https://example.com or Google Drive link"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label>File</Label>
              <label
                htmlFor="res-file"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/40"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {draft.file_url ? "Replace file" : "Upload file"}
              </label>
              <input
                id="res-file"
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                onChange={onFile}
              />
              {draft.file_url ? (
                <p className="truncate text-xs text-success">File attached ✓</p>
              ) : (
                <p className="text-xs text-muted-foreground">PDF, DOCX, PPT, or ZIP · up to 25 MB</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy || uploading}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {draft.id ? "Save resource" : "Add resource"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
