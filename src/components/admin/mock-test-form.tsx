"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveMockTest, type MockTestInput } from "@/features/admin/mock-test-actions";
import { slugify } from "@/lib/slug";

type Option = { id: string; name: string };
type TestType = "topic" | "practice" | "full";

export function MockTestForm({
  initial,
  categories,
}: {
  initial?: {
    id: string;
    title: string;
    slug: string;
    category_id: string | null;
    test_type: TestType;
    duration_minutes: number;
    is_free: boolean;
  };
  categories: Option[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "none");
  const [type, setType] = useState<TestType>(initial?.test_type ?? "topic");
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 10));
  const [free, setFree] = useState(initial?.is_free ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: MockTestInput = {
      id: initial?.id,
      title,
      slug: slug.trim() || slugify(title),
      category_id: categoryId === "none" ? "" : categoryId,
      test_type: type,
      duration_minutes: Number(duration) || 0,
      is_free: free,
    };
    const res = await saveMockTest(payload);
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    if (initial) {
      toast.success("Test saved.");
      setLoading(false);
    }
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
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
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as TestType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="topic">Topic</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="full">Full</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (min)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={free} onCheckedChange={setFree} id="free" />
        <Label htmlFor="free">Free</Label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {initial ? "Save test" : "Create & add questions"}
      </Button>
    </form>
  );
}
