"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CirclePlay, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  addModule,
  deleteModule,
  addLesson,
  deleteLesson,
} from "@/features/admin/program-actions";

type Lesson = { id: string; title: string; is_preview: boolean | null };
type Module = { id: string; title: string; lessons: Lesson[] };

export function ModuleManager({
  programId,
  modules,
}: {
  programId: string;
  modules: Module[];
}) {
  const router = useRouter();
  const [newModule, setNewModule] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ error?: string }>) {
    setBusy(true);
    const res = await fn();
    if (res.error) toast.error(res.error);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      {/* Add module */}
      <div className="flex gap-2 rounded-2xl border border-border bg-card p-4 shadow-card">
        <Input
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          placeholder="New module title…"
        />
        <Button
          disabled={busy || !newModule.trim()}
          onClick={async () => {
            await run(() => addModule(programId, newModule));
            setNewModule("");
          }}
        >
          <Plus className="size-4" />
          Add module
        </Button>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No modules yet. Add one above to start building the curriculum.
        </p>
      ) : (
        modules.map((mod) => (
          <ModuleCard key={mod.id} mod={mod} programId={programId} busy={busy} run={run} />
        ))
      )}
    </div>
  );
}

function ModuleCard({
  mod,
  programId,
  busy,
  run,
}: {
  mod: Module;
  programId: string;
  busy: boolean;
  run: (fn: () => Promise<{ error?: string }>) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-medium text-foreground">{mod.title}</h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
          onClick={() => run(() => deleteModule(mod.id, programId))}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {mod.lessons.map((l) => (
          <li key={l.id} className="flex items-center justify-between p-3 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              {l.is_preview ? (
                <CirclePlay className="size-4 text-primary" />
              ) : (
                <Lock className="size-4 text-muted-foreground" />
              )}
              {l.title}
              {l.is_preview ? <Badge variant="secondary">Preview</Badge> : null}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => run(() => deleteLesson(l.id, programId))}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-4">
        {showAdd ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`lt-${mod.id}`}>Lesson title</Label>
              <Input
                id={`lt-${mod.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`lv-${mod.id}`}>YouTube URL</Label>
              <Input
                id={`lv-${mod.id}`}
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                placeholder="https://www.youtube.com/embed/…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`lc-${mod.id}`}>Content (Markdown)</Label>
              <Textarea
                id={`lc-${mod.id}`}
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={preview} onCheckedChange={setPreview} id={`lp-${mod.id}`} />
              <Label htmlFor={`lp-${mod.id}`}>Free preview</Label>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy || !title.trim()}
                onClick={async () => {
                  await run(() =>
                    addLesson(mod.id, programId, {
                      title,
                      video_url: video,
                      content_md: content,
                      is_preview: preview,
                    }),
                  );
                  setTitle("");
                  setVideo("");
                  setContent("");
                  setPreview(false);
                  setShowAdd(false);
                }}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Add lesson
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="size-4" />
            Add lesson
          </Button>
        )}
      </div>
    </div>
  );
}
