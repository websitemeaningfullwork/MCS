"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { saveLiveClass } from "@/features/admin/live-class-actions";

type Option = { id: string; label: string };
const NONE = "__none__";

export function LiveClassForm({
  initial,
  mentors = [],
  programs = [],
}: {
  initial?: {
    id: string;
    title: string;
    description: string;
    starts_at: string; // datetime-local value
    meeting_url: string;
    replay_url: string;
    is_public: boolean;
    mentor_id: string | null;
    program_id: string | null;
  };
  mentors?: Option[];
  programs?: Option[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startsAt, setStartsAt] = useState(initial?.starts_at ?? "");
  const [meeting, setMeeting] = useState(initial?.meeting_url ?? "");
  const [replay, setReplay] = useState(initial?.replay_url ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [mentorId, setMentorId] = useState(initial?.mentor_id ?? NONE);
  const [programId, setProgramId] = useState(initial?.program_id ?? NONE);
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
      mentor_id: mentorId === NONE ? null : mentorId,
      program_id: programId === NONE ? null : programId,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mentor">Mentor (optional)</Label>
          <Select value={mentorId} onValueChange={setMentorId}>
            <SelectTrigger id="mentor">
              <SelectValue placeholder="No mentor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No mentor</SelectItem>
              {mentors.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="program">Program (optional)</Label>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger id="program">
              <SelectValue placeholder="No program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No program</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
