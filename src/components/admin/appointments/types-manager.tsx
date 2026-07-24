"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AppointmentIcon,
  APPOINTMENT_ICON_KEYS,
} from "@/components/appointments/appointment-icon";
import { useConfirm } from "@/components/shared/confirm-dialog";
import {
  saveAppointmentType,
  deleteAppointmentType,
} from "@/features/appointments/admin-actions";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ApptType = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  default_price_bdt: number;
  default_duration: number;
  status: string;
  sort_order: number;
};

type Draft = {
  id?: string;
  name: string;
  description: string;
  icon: string;
  default_price_bdt: string;
  default_duration: string;
  status: "active" | "inactive";
  sort_order: string;
};

const EMPTY: Draft = {
  name: "",
  description: "",
  icon: "compass",
  default_price_bdt: "700",
  default_duration: "120",
  status: "active",
  sort_order: "0",
};

export function TypesManager({ types }: { types: ApptType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, start] = useTransition();
  const { confirm, confirmDialog } = useConfirm();

  function edit(t: ApptType) {
    setDraft({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      icon: t.icon,
      default_price_bdt: String(t.default_price_bdt),
      default_duration: String(t.default_duration),
      status: t.status === "inactive" ? "inactive" : "active",
      sort_order: String(t.sort_order),
    });
    setOpen(true);
  }

  function create() {
    setDraft(EMPTY);
    setOpen(true);
  }

  function save() {
    start(async () => {
      const res = await saveAppointmentType({
        id: draft.id,
        name: draft.name,
        description: draft.description,
        icon: draft.icon,
        default_price_bdt: Number(draft.default_price_bdt) || 0,
        default_duration: Number(draft.default_duration) || 120,
        status: draft.status,
        sort_order: Number(draft.sort_order) || 0,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved.");
        setOpen(false);
        router.refresh();
      }
    });
  }

  async function remove(t: ApptType) {
    const ok = await confirm({
      title: `Delete “${t.name}”?`,
      description:
        "This appointment type will be removed from the booking wizard. This cannot be undone.",
      confirmLabel: "Delete type",
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteAppointmentType(t.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deleted.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Types shown in the booking wizard. Add as many as you need.
        </p>
        <Button onClick={create} className="rounded-full">
          <Plus className="size-4" /> Add New Type
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <AppointmentIcon name={t.icon} className="size-5" />
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => edit(t)}
                  aria-label={`Edit ${t.name}`}
                  title={`Edit ${t.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => void remove(t)}
                  aria-label={`Delete ${t.name}`}
                  title={`Delete ${t.name}`}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="mt-2 font-semibold text-foreground">{t.name}</p>
            {t.description ? (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
            ) : null}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {formatBDT(t.default_price_bdt)} · {t.default_duration} min
              </span>
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 font-medium",
                  t.status === "active"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
        {types.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointment types yet.</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit type" : "New appointment type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Name</Label>
              <Input
                id="t-name"
                value={draft.name}
                onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea
                id="t-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {APPOINTMENT_ICON_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDraft((s) => ({ ...s, icon: k }))}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border transition-colors",
                      draft.icon === k
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                    aria-label={k}
                  >
                    <AppointmentIcon name={k} className="size-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="t-price">Price (৳)</Label>
                <Input
                  id="t-price"
                  type="number"
                  min={0}
                  value={draft.default_price_bdt}
                  onChange={(e) => setDraft((s) => ({ ...s, default_price_bdt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-dur">Duration (min)</Label>
                <Input
                  id="t-dur"
                  type="number"
                  min={15}
                  value={draft.default_duration}
                  onChange={(e) => setDraft((s) => ({ ...s, default_duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-sort">Sort</Label>
                <Input
                  id="t-sort"
                  type="number"
                  min={0}
                  value={draft.sort_order}
                  onChange={(e) => setDraft((s) => ({ ...s, sort_order: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft((s) => ({ ...s, status: v as Draft["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={busy || draft.name.trim().length < 2} className="w-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save type
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}
