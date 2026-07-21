"use client";

import { useState } from "react";
import { Plus, GripVertical, Pencil, Trash2, CirclePlay, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClassItem, ClassStatus, Season } from "./types";

const STATUS_DOT: Record<ClassStatus, string> = {
  published: "bg-success",
  draft: "bg-warning",
  hidden: "bg-muted-foreground",
};

export function SeasonTree({
  season,
  selectedClassId,
  onSelectClass,
  onAddClass,
  onDeleteClass,
  onReorderClasses,
}: {
  season: Season | null;
  selectedClassId: string | null;
  onSelectClass: (id: string) => void;
  onAddClass: () => void;
  onDeleteClass: (id: string) => void;
  onReorderClasses: (orderedIds: string[]) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  if (!season) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
        Select or add a season to manage its classes.
      </div>
    );
  }

  function handleDrop(targetId: string) {
    if (!season || !dragId || dragId === targetId) return;
    const ids = season.classes.map((c) => c.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    onReorderClasses(ids);
    setDragId(null);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Seasons &amp; Classes</h2>
        <div className="mt-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
          <p className="text-sm font-medium text-foreground">{season.title}</p>
          {season.subtitle ? (
            <p className="text-xs text-muted-foreground">{season.subtitle}</p>
          ) : null}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {season.classes.length} {season.classes.length === 1 ? "Class" : "Classes"}
          </p>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onAddClass}>
          <Plus className="size-4" />
          Add Class
        </Button>

        {season.classes.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            No classes yet. Add one to start.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {season.classes.map((cls, i) => (
              <ClassRow
                key={cls.id}
                cls={cls}
                index={i}
                active={cls.id === selectedClassId}
                onSelect={() => onSelectClass(cls.id)}
                onDelete={() => onDeleteClass(cls.id)}
                onDragStart={() => setDragId(cls.id)}
                onDrop={() => handleDrop(cls.id)}
                dragging={dragId === cls.id}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClassRow({
  cls,
  index,
  active,
  onSelect,
  onDelete,
  onDragStart,
  onDrop,
  dragging,
}: {
  cls: ClassItem;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  dragging: boolean;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "group flex items-center gap-1.5 rounded-xl border px-2 py-2 transition-colors",
        active
          ? "border-primary/40 bg-primary/5"
          : "border-transparent hover:border-border hover:bg-secondary/50",
        dragging && "opacity-50",
      )}
    >
      <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[cls.status])}
          aria-hidden
        />
        <span className="min-w-0">
          <span className={cn("block text-sm", active ? "font-medium text-primary" : "text-foreground")}>
            Class {index + 1}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{cls.title}</span>
        </span>
      </button>
      {cls.is_preview ? (
        <CirclePlay className="size-3.5 shrink-0 text-primary" aria-label="Free preview" />
      ) : (
        <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0"
        onClick={onSelect}
        aria-label="Edit class"
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
        aria-label="Delete class"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}
