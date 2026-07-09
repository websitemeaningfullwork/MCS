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
import { saveProgram, type ProgramInput } from "@/features/admin/program-actions";
import { slugify, linesToArray, arrayToLines } from "@/lib/slug";

type Option = { id: string; name: string };
type Level = "beginner" | "intermediate" | "advanced" | "all_levels";

export function ProgramForm({
  initial,
  categories,
  mentors,
}: {
  initial?: {
    id: string;
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    category_id: string | null;
    mentor_id: string | null;
    price_bdt: number;
    discount_bdt: number;
    level: Level;
    learning_outcomes: string[];
    requirements: string[];
    is_featured: boolean;
    status: "draft" | "published";
  };
  categories: Option[];
  mentors: Option[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "none");
  const [mentorId, setMentorId] = useState(initial?.mentor_id ?? "none");
  const [price, setPrice] = useState(String(initial?.price_bdt ?? 0));
  const [discount, setDiscount] = useState(String(initial?.discount_bdt ?? 0));
  const [level, setLevel] = useState<Level>(initial?.level ?? "all_levels");
  const [outcomes, setOutcomes] = useState(arrayToLines(initial?.learning_outcomes));
  const [requirements, setRequirements] = useState(
    arrayToLines(initial?.requirements),
  );
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [status, setStatus] = useState<"draft" | "published">(
    initial?.status ?? "draft",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: ProgramInput = {
      id: initial?.id,
      title,
      slug: slug.trim() || slugify(title),
      subtitle,
      description,
      category_id: categoryId === "none" ? "" : categoryId,
      mentor_id: mentorId === "none" ? "" : mentorId,
      price_bdt: Number(price) || 0,
      discount_bdt: Number(discount) || 0,
      level,
      learning_outcomes: linesToArray(outcomes),
      requirements: linesToArray(requirements),
      is_featured: featured,
      status,
    };
    const res = await saveProgram(payload);
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    if (initial) {
      toast.success("Program saved.");
      setLoading(false);
    }
    // create redirects to the edit page
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
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
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
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
        <div className="space-y-2">
          <Label>Mentor</Label>
          <Select value={mentorId} onValueChange={setMentorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select mentor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No mentor</SelectItem>
              {mentors.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Price (BDT)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount">Discount price (BDT)</Label>
          <Input
            id="discount"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="all_levels">All levels</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="outcomes">Learning outcomes (one per line)</Label>
          <Textarea
            id="outcomes"
            rows={4}
            value={outcomes}
            onChange={(e) => setOutcomes(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requirements">Requirements (one per line)</Label>
          <Textarea
            id="requirements"
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
          <Label htmlFor="featured">Featured</Label>
        </div>
        <div className="flex items-center gap-3">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {initial ? "Save program" : "Create & add lessons"}
      </Button>
    </form>
  );
}
