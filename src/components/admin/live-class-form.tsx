"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { saveLiveClass } from "@/features/admin/live-class-actions";

export function LiveClassForm({
  initial,
}: {
  initial?: {
    id: string;
    title: string;
    description: string;
    starts_at: string; // datetime-local value
    meeting_url: string;
    replay_url: string;
    is_public: boolean;
  };
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startsAt, setStartsAt] = useState(initial?.starts_at ?? "");
  const [meeting, setMeeting] = useState(initial?.meeting_url ?? "");
  const [replay, setReplay] = useState(initial?.replay_url ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await saveLiveClass({
      id: initial?.id,
      title,
      description,
      starts_at: startsAt,
      meeting_url: meeting,
      replay_url: replay,
      is_public: isPublic,
    });
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="starts">Starts at</Label>
        <Input
          id="starts"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting">Meeting URL</Label>
          <Input id="meeting" value={meeting} onChange={(e) => setMeeting(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="replay">Replay URL (recorded)</Label>
          <Input id="replay" value={replay} onChange={(e) => setReplay(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isPublic} onCheckedChange={setIsPublic} id="public" />
        <Label htmlFor="public">Public</Label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {initial ? "Save class" : "Create class"}
      </Button>
    </form>
  );
}
