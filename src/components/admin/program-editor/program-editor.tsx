"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, CircleAlert, Loader2, CloudUpload } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { useDebounced } from "./use-autosave";
import { ProgramInfoPanel } from "./program-info-panel";
import { SeasonTree } from "./season-tree";
import { ClassEditor } from "./class-editor";
import {
  updateProgramInfo,
  updateClass,
  createSeason,
  updateSeason,
  deleteSeason,
  reorderSeasons,
  createClass,
  deleteClass,
  duplicateClass,
  reorderClasses,
  assignMentor,
  removeMentor,
  setPrimaryMentor,
} from "@/features/admin/program-editor-actions";
import type {
  AssignedMentor,
  CategoryOption,
  ClassItem,
  MentorOption,
  ProgramInfo,
  Question,
  Resource,
  SaveStatus,
  Season,
} from "./types";

export function ProgramEditor({
  initialInfo,
  initialSeasons,
  initialMentors,
  categories,
  mentorOptions,
}: {
  initialInfo: ProgramInfo;
  initialSeasons: Season[];
  initialMentors: AssignedMentor[];
  categories: CategoryOption[];
  mentorOptions: MentorOption[];
}) {
  const [info, setInfo] = useState<ProgramInfo>(initialInfo);
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons);
  const [mentors, setMentors] = useState<AssignedMentor[]>(initialMentors);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(
    initialSeasons[0]?.id ?? null,
  );
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    initialSeasons[0]?.classes[0]?.id ?? null,
  );
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  // ---- save wrappers -------------------------------------------------------
  const save = useCallback(
    async (fn: () => Promise<{ error?: string }>): Promise<boolean> => {
      setStatus("saving");
      try {
        const res = await fn();
        if (res?.error) {
          toast.error(res.error);
          setStatus("error");
          return false;
        }
        setStatus("saved");
        setLastSaved(new Date());
        return true;
      } catch (e) {
        console.error(e);
        toast.error("Something went wrong. Please try again.");
        setStatus("error");
        return false;
      }
    },
    [],
  );

  async function saveData<T>(
    fn: () => Promise<{ error?: string; data?: T }>,
  ): Promise<T | null> {
    setStatus("saving");
    const res = await fn();
    if (res.error) {
      toast.error(res.error);
      setStatus("error");
      return null;
    }
    setStatus("saved");
    setLastSaved(new Date());
    return res.data ?? null;
  }

  // ---- program info autosave ----------------------------------------------
  const programPending = useRef<Partial<ProgramInfo>>({});
  const programReval = useRef(false);
  const programSaver = useDebounced(() => {
    const patch = programPending.current;
    programPending.current = {};
    const reval = programReval.current;
    programReval.current = false;
    if (Object.keys(patch).length === 0) return;
    void save(() => updateProgramInfo(info.id, patch, { revalidate: reval }));
  }, 700);

  const patchInfo = useCallback(
    (patch: Partial<ProgramInfo>, opts?: { revalidate?: boolean }) => {
      setInfo((prev) => ({ ...prev, ...patch }));
      programPending.current = { ...programPending.current, ...patch };
      if (opts?.revalidate) programReval.current = true;
      programSaver.call();
    },
    [programSaver],
  );

  // ---- class autosave ------------------------------------------------------
  const classPending = useRef<{ id: string; patch: Partial<ClassItem> } | null>(null);
  const classSaver = useDebounced(() => {
    const p = classPending.current;
    classPending.current = null;
    if (!p || Object.keys(p.patch).length === 0) return;
    void save(() => updateClass(p.id, p.patch));
  }, 700);

  const mutateClassState = useCallback(
    (classId: string, patch: Partial<ClassItem>) => {
      setSeasons((prev) =>
        prev.map((s) => ({
          ...s,
          classes: s.classes.map((c) => (c.id === classId ? { ...c, ...patch } : c)),
        })),
      );
    },
    [],
  );

  const patchClass = useCallback(
    (classId: string, patch: Partial<ClassItem>) => {
      mutateClassState(classId, patch);
      if (classPending.current && classPending.current.id !== classId) {
        classSaver.flush();
      }
      classPending.current = {
        id: classId,
        patch: { ...(classPending.current?.patch ?? {}), ...patch },
      };
      classSaver.call();
    },
    [classSaver, mutateClassState],
  );

  async function handleSaveChanges() {
    programSaver.flush();
    classSaver.flush();
    setStatus("saved");
    setLastSaved(new Date());
    toast.success("All changes saved.");
  }

  // ---- season handlers -----------------------------------------------------
  async function handleAddSeason() {
    const data = await saveData(() => createSeason(info.id));
    if (!data) return;
    const newSeason: Season = {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      sort_order: data.sort_order,
      classes: [],
    };
    setSeasons((prev) => [...prev, newSeason]);
    setActiveSeasonId(newSeason.id);
    setSelectedClassId(null);
  }

  function handleUpdateSeason(id: string, patch: { title?: string; subtitle?: string | null }) {
    setSeasons((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    void save(() => updateSeason(id, patch));
  }

  async function handleDeleteSeason(id: string) {
    const season = seasons.find((s) => s.id === id);
    const confirmed = await confirm({
      title: season ? `Delete “${season.title}”?` : "Delete this season?",
      description: `This season and its ${season?.classes.length ?? 0} class(es) will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete season",
    });
    if (!confirmed) return;
    const ok = await save(() => deleteSeason(id));
    if (!ok) return;
    setSeasons((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSeasonId === id) {
        const fallback = next[0] ?? null;
        setActiveSeasonId(fallback?.id ?? null);
        setSelectedClassId(fallback?.classes[0]?.id ?? null);
      }
      return next;
    });
  }

  function handleReorderSeasons(orderedIds: string[]) {
    setSeasons((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      return orderedIds.map((id, i) => ({ ...byId.get(id)!, sort_order: i }));
    });
    void save(() => reorderSeasons(info.id, orderedIds));
  }

  function handleSelectSeason(id: string) {
    classSaver.flush();
    setActiveSeasonId(id);
    const season = seasons.find((s) => s.id === id);
    setSelectedClassId(season?.classes[0]?.id ?? null);
  }

  // ---- class handlers ------------------------------------------------------
  async function handleAddClass() {
    if (!activeSeasonId) return;
    const data = await saveData(() => createClass(activeSeasonId));
    if (!data) return;
    const newClass = toClassItem(data);
    setSeasons((prev) =>
      prev.map((s) =>
        s.id === activeSeasonId ? { ...s, classes: [...s.classes, newClass] } : s,
      ),
    );
    setSelectedClassId(newClass.id);
  }

  async function handleDeleteClass(id: string) {
    if (!confirm("Delete this class?")) return;
    const ok = await save(() => deleteClass(id));
    if (!ok) return;
    setSeasons((prev) =>
      prev.map((s) => ({ ...s, classes: s.classes.filter((c) => c.id !== id) })),
    );
    if (selectedClassId === id) {
      const season = seasons.find((s) => s.id === activeSeasonId);
      const remaining = season?.classes.filter((c) => c.id !== id) ?? [];
      setSelectedClassId(remaining[0]?.id ?? null);
    }
  }

  async function handleDuplicateClass(id: string) {
    const data = await saveData(() => duplicateClass(id));
    if (!data) return;
    // duplicateClass copies resources/questions server-side, but their real ids
    // only arrive on reload — keep the optimistic copy's lists empty (rather than
    // faking ids that would break inline edit/delete) and prompt a reopen.
    const source = seasons.flatMap((s) => s.classes).find((c) => c.id === id);
    const hadExtras = !!source && (source.resources.length > 0 || source.questions.length > 0);
    const copy = toClassItem(data);
    setSeasons((prev) =>
      prev.map((s) =>
        s.id === copy.module_id ? { ...s, classes: [...s.classes, copy] } : s,
      ),
    );
    setSelectedClassId(copy.id);
    toast.success(
      hadExtras
        ? "Class duplicated. Reopen the program to see its copied resources & quiz."
        : "Class duplicated.",
    );
  }

  function handleReorderClasses(orderedIds: string[]) {
    setSeasons((prev) =>
      prev.map((s) => {
        if (s.id !== activeSeasonId) return s;
        const byId = new Map(s.classes.map((c) => [c.id, c]));
        return {
          ...s,
          classes: orderedIds.map((id, i) => ({ ...byId.get(id)!, sort_order: i })),
        };
      }),
    );
    if (activeSeasonId) void save(() => reorderClasses(activeSeasonId, orderedIds));
  }

  function handleClassResources(classId: string, resources: Resource[]) {
    setSeasons((prev) =>
      prev.map((s) => ({
        ...s,
        classes: s.classes.map((c) => (c.id === classId ? { ...c, resources } : c)),
      })),
    );
  }

  function handleClassQuestions(classId: string, questions: Question[]) {
    setSeasons((prev) =>
      prev.map((s) => ({
        ...s,
        classes: s.classes.map((c) => (c.id === classId ? { ...c, questions } : c)),
      })),
    );
  }

  // ---- mentor handlers -----------------------------------------------------
  async function handleAssignMentor(mentorId: string) {
    const ok = await save(() => assignMentor(info.id, mentorId));
    if (!ok) return;
    setMentors((prev) => [
      ...prev,
      { mentor_id: mentorId, is_primary: prev.length === 0, sort_order: prev.length },
    ]);
  }

  async function handleRemoveMentor(mentorId: string) {
    const ok = await save(() => removeMentor(info.id, mentorId));
    if (!ok) return;
    setMentors((prev) => {
      const removed = prev.find((m) => m.mentor_id === mentorId);
      let next = prev.filter((m) => m.mentor_id !== mentorId);
      if (removed?.is_primary && next.length > 0) {
        next = next.map((m, i) => (i === 0 ? { ...m, is_primary: true } : m));
      }
      return next;
    });
  }

  async function handleSetPrimary(mentorId: string) {
    const ok = await save(() => setPrimaryMentor(info.id, mentorId));
    if (!ok) return;
    setMentors((prev) =>
      prev.map((m) => ({ ...m, is_primary: m.mentor_id === mentorId })),
    );
  }

  // ---- derived -------------------------------------------------------------
  const activeSeason = seasons.find((s) => s.id === activeSeasonId) ?? null;
  const selectedClass =
    activeSeason?.classes.find((c) => c.id === selectedClassId) ?? null;
  const classLabel = selectedClass
    ? `Class ${(activeSeason?.classes.findIndex((c) => c.id === selectedClass.id) ?? 0) + 1}`
    : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to programs
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Edit Program
          </h1>
        </div>
        <SaveStatusPill status={status} />
      </div>

      {/* 3-column workspace */}
      <div className="grid gap-4 xl:grid-cols-[290px_250px_minmax(0,1fr)]">
        <ProgramInfoPanel
          info={info}
          onPatchInfo={patchInfo}
          categories={categories}
          seasons={seasons}
          activeSeasonId={activeSeasonId}
          onSelectSeason={handleSelectSeason}
          onAddSeason={handleAddSeason}
          onUpdateSeason={handleUpdateSeason}
          onDeleteSeason={handleDeleteSeason}
          onReorderSeasons={handleReorderSeasons}
          mentorOptions={mentorOptions}
          assignedMentors={mentors}
          onAssignMentor={handleAssignMentor}
          onRemoveMentor={handleRemoveMentor}
          onSetPrimary={handleSetPrimary}
        />

        <SeasonTree
          season={activeSeason}
          selectedClassId={selectedClassId}
          onSelectClass={(id) => {
            classSaver.flush();
            setSelectedClassId(id);
          }}
          onAddClass={handleAddClass}
          onDeleteClass={handleDeleteClass}
          onReorderClasses={handleReorderClasses}
        />

        {selectedClass ? (
          <ClassEditor
            key={selectedClass.id}
            cls={selectedClass}
            label={classLabel}
            programSlug={info.slug}
            onPatch={(patch) => patchClass(selectedClass.id, patch)}
            onResourcesChange={(r) => handleClassResources(selectedClass.id, r)}
            onQuestionsChange={(q) => handleClassQuestions(selectedClass.id, q)}
            onDuplicate={() => handleDuplicateClass(selectedClass.id)}
            onDelete={() => handleDeleteClass(selectedClass.id)}
            onSaveChanges={handleSaveChanges}
            save={save}
          />
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            {activeSeason
              ? "Select a class on the left, or add one to start editing."
              : "Add a season, then add classes to build the program."}
          </div>
        )}
      </div>

      {/* Autosave footer */}
      <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-sm text-muted-foreground">
        <Check className="size-4 text-success" />
        Changes are saved automatically.
        {lastSaved ? (
          <span className="text-foreground">
            Last updated:{" "}
            {lastSaved.toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SaveStatusPill({ status }: { status: SaveStatus }) {
  const map = {
    idle: { icon: CloudUpload, text: "Autosave on", cls: "text-muted-foreground" },
    saving: { icon: Loader2, text: "Saving…", cls: "text-primary" },
    saved: { icon: Check, text: "Saved", cls: "text-success" },
    error: { icon: CircleAlert, text: "Save failed", cls: "text-destructive" },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", cls)}>
      <Icon className={cn("size-4", status === "saving" && "animate-spin")} />
      {text}
    </span>
  );
}

function toClassItem(d: {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  overview_html: string | null;
  thumbnail_url: string | null;
  admin_notes: string | null;
  status: string;
  is_preview: boolean;
  duration_seconds: number | null;
  sort_order: number;
}): ClassItem {
  return {
    ...d,
    status: (d.status as ClassItem["status"]) ?? "draft",
    resources: [],
    questions: [],
  };
}
