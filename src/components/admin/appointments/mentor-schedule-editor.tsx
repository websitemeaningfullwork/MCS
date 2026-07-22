"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

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
import { saveMentorSchedule } from "@/features/appointments/admin-actions";
import { WEEKDAYS, type Weekday } from "@/features/admin/mentor-schema";
import type { MentorAvailability } from "@/features/appointments/slots";
import { cn } from "@/lib/utils";

export type ScheduleMentor = {
  id: string;
  name: string;
  availability: MentorAvailability;
  session_duration: number | null;
};

type State = {
  working_days: string[];
  start_time: string;
  end_time: string;
  breaks: { start: string; end: string }[];
  max_per_day: string;
  unavailable_dates: string[];
};

function toState(a: MentorAvailability): State {
  return {
    working_days: a.working_days ?? ["mon", "tue", "wed", "thu", "fri"],
    start_time: a.start_time ?? "09:00",
    end_time: a.end_time ?? "17:00",
    breaks: a.breaks ?? [],
    max_per_day: a.max_per_day ? String(a.max_per_day) : "",
    unavailable_dates: a.unavailable_dates ?? [],
  };
}

export function MentorScheduleEditor({ mentors }: { mentors: ScheduleMentor[] }) {
  const router = useRouter();
  const [mentorId, setMentorId] = useState(mentors[0].id);
  const active = mentors.find((m) => m.id === mentorId)!;
  const [state, setState] = useState<State>(toState(active.availability));
  const [holiday, setHoliday] = useState("");
  const [busy, start] = useTransition();

  function switchMentor(id: string) {
    setMentorId(id);
    const m = mentors.find((x) => x.id === id)!;
    setState(toState(m.availability));
  }

  function toggleDay(day: Weekday) {
    setState((s) => ({
      ...s,
      working_days: s.working_days.includes(day)
        ? s.working_days.filter((d) => d !== day)
        : [...s.working_days, day],
    }));
  }

  function save() {
    start(async () => {
      const res = await saveMentorSchedule(mentorId, {
        working_days: state.working_days,
        start_time: state.start_time,
        end_time: state.end_time,
        breaks: state.breaks.filter((b) => b.start && b.end),
        max_per_day: state.max_per_day ? Number(state.max_per_day) : null,
        unavailable_dates: state.unavailable_dates,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Schedule saved.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-xs space-y-2">
          <Label>Mentor</Label>
          <Select value={mentorId} onValueChange={switchMentor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Schedule
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold text-foreground">Working Days & Hours</h2>
          <div className="space-y-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const on = state.working_days.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary/50",
                    )}
                    aria-pressed={on}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-start">Start Time</Label>
              <Input
                id="s-start"
                type="time"
                value={state.start_time}
                onChange={(e) => setState((s) => ({ ...s, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-end">End Time</Label>
              <Input
                id="s-end"
                type="time"
                value={state.end_time}
                onChange={(e) => setState((s) => ({ ...s, end_time: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-max">Max Appointments Per Day</Label>
            <Input
              id="s-max"
              type="number"
              min={0}
              value={state.max_per_day}
              onChange={(e) => setState((s) => ({ ...s, max_per_day: e.target.value }))}
              placeholder="No limit"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no daily cap. Slot length comes from the mentor&apos;s session
              duration.
            </p>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold text-foreground">Breaks & Holidays</h2>
          <div className="space-y-2">
            <Label>Break Times</Label>
            {state.breaks.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={b.start}
                  onChange={(e) =>
                    setState((s) => {
                      const breaks = [...s.breaks];
                      breaks[i] = { ...breaks[i], start: e.target.value };
                      return { ...s, breaks };
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={b.end}
                  onChange={(e) =>
                    setState((s) => {
                      const breaks = [...s.breaks];
                      breaks[i] = { ...breaks[i], end: e.target.value };
                      return { ...s, breaks };
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setState((s) => ({ ...s, breaks: s.breaks.filter((_, j) => j !== i) }))
                  }
                  aria-label="Remove break"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setState((s) => ({ ...s, breaks: [...s.breaks, { start: "13:00", end: "14:00" }] }))
              }
            >
              <Plus className="size-4" /> Add Break
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Holidays / Unavailable Dates</Label>
            <div className="flex items-center gap-2">
              <Input type="date" value={holiday} onChange={(e) => setHoliday(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!holiday || state.unavailable_dates.includes(holiday)) return;
                  setState((s) => ({
                    ...s,
                    unavailable_dates: [...s.unavailable_dates, holiday].sort(),
                  }));
                  setHoliday("");
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.unavailable_dates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        unavailable_dates: s.unavailable_dates.filter((x) => x !== d),
                      }))
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${d}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {state.unavailable_dates.length === 0 ? (
                <p className="text-xs text-muted-foreground">No holidays set.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
