"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Star,
  User,
  Video,
} from "lucide-react";

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
import { AppointmentIcon } from "@/components/appointments/appointment-icon";
import {
  getDaySlots,
  getMentorsForSlot,
  createAppointment,
  type DaySlot,
  type MentorCard,
} from "@/features/appointments/actions";
import { formatSlotLabel, todayInDhaka } from "@/features/appointments/slots";
import {
  GENDERS,
  OCCUPATIONS,
  bookingDetailsSchema,
  type BookingDetails,
} from "@/features/appointments/schema";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export type WizardType = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  default_price_bdt: number;
  default_duration: number;
};

const STEPS = [
  { n: 1, label: "Choose Type" },
  { n: 2, label: "Date & Time" },
  { n: 3, label: "Your Details" },
  { n: 4, label: "Select Mentor" },
  { n: 5, label: "Review & Pay" },
] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Step-3 working state. Gender is widened to allow "" because the wizard must be
 * able to represent "not answered yet" — pre-selecting a gender silently writes
 * a wrong value for anyone who does not notice the field. `bookingDetailsSchema`
 * has no such state (and is shared with the server), so the draft is narrowed
 * back to `BookingDetails` by validation before the step advances.
 */
/**
 * Step 3 while it is still being filled in. `gender` and `occupation` start
 * empty so neither is silently answered on the student's behalf — a
 * pre-selected value is indistinguishable from a deliberate one once it lands
 * in the database. The shared `bookingDetailsSchema` is untouched; "" simply
 * never passes it, and `validateDetails()` narrows back to `BookingDetails`.
 */
type DetailsDraft = Omit<BookingDetails, "gender" | "occupation"> & {
  gender: BookingDetails["gender"] | "";
  occupation: string;
};

function prettyDate(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    dt.getUTCDay()
  ];
  return `${wd}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export function BookingWizard({
  types,
  initialProfile,
}: {
  types: WizardType[];
  initialProfile: { full_name: string; phone: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [typeId, setTypeId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const selectedType = types.find((t) => t.id === typeId) ?? null;
  const isOwnTopic = selectedType?.name.toLowerCase() === "own topic";

  // Step 2
  const today = todayInDhaka();
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  const [view, setView] = useState({ year: ty, month: tm });
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [loadingSlots, startSlots] = useTransition();

  // Step 3 — no pre-filled gender or age; both must be answered deliberately.
  const [details, setDetails] = useState<DetailsDraft>({
    full_name: initialProfile.full_name,
    phone: initialProfile.phone,
    whatsapp: initialProfile.phone,
    gender: "",
    age: 0, // renders as an empty field; the schema rejects it until entered
    occupation: "",
    note: "",
  });
  /** The step-3 draft after it has passed `bookingDetailsSchema`. */
  const [validDetails, setValidDetails] = useState<BookingDetails | null>(null);

  /** Any edit invalidates the last validated snapshot, so it can never go stale. */
  function patchDetails(patch: Partial<DetailsDraft>) {
    setDetails((d) => ({ ...d, ...patch }));
    setValidDetails(null);
  }

  // Step 4
  const [mentors, setMentors] = useState<MentorCard[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [loadingMentors, startMentors] = useTransition();
  const selectedMentor = mentors.find((m) => m.id === mentorId) ?? null;

  // Step 5
  const [submitting, setSubmitting] = useState(false);

  function pickDate(d: string) {
    setDate(d);
    setTime(null);
    startSlots(async () => {
      const res = await getDaySlots(d);
      setSlots(res.slots);
    });
  }

  function goToMentors() {
    if (!date || !time) return;
    setMentorId(null);
    setStep(4);
    startMentors(async () => {
      const res = await getMentorsForSlot(date, time);
      setMentors(res.mentors);
    });
  }

  /**
   * Narrows the step-3 draft to a valid `BookingDetails` and stashes it, so the
   * final submit can never send a half-filled payload. Unanswered gender is
   * checked first — the raw zod enum error is not a sentence a person should
   * have to read.
   */
  function validateDetails(): boolean {
    // Check the unselected dropdowns first: the raw zod enum/min-length
    // messages read like schema errors, not instructions.
    if (!details.gender) {
      toast.error("Select your gender.");
      return false;
    }
    if (!details.occupation) {
      toast.error("Select what you do.");
      return false;
    }
    const parsed = bookingDetailsSchema.safeParse(details);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete your details.");
      return false;
    }
    setValidDetails(parsed.data);
    return true;
  }

  async function submit() {
    if (!selectedType || !date || !time || !selectedMentor) return;
    if (!validDetails) {
      toast.error("Please complete your details.");
      setStep(3);
      return;
    }
    setSubmitting(true);
    const res = await createAppointment({
      type_id: selectedType.id,
      type_name: selectedType.name,
      topic: isOwnTopic ? topic : "",
      mentor_id: selectedMentor.id,
      date,
      start_time: time,
      details: validDetails,
    });
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error);
      // A taken slot means step 2 needs redoing.
      if (res.error.toLowerCase().includes("slot")) setStep(2);
      return;
    }
    router.push(`/appointments/${res.id}/pay`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Book an <span className="text-primary">Appointment</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          One-on-one mentoring — pick a topic, a time, and a mentor.
        </p>
      </div>

      <ProgressBar step={step} />

      <div className="mt-8">
        {step === 1 && (
          <StepCard title="1. Choose Appointment Type" subtitle="What would you like to talk about?">
            <div className="grid gap-3 sm:grid-cols-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeId(t.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                    typeId === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-secondary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      typeId === t.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <AppointmentIcon name={t.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{t.name}</span>
                    {t.description ? (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {t.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>

            {isOwnTopic ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="topic">Your topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Briefly, what would you like to discuss?"
                />
              </div>
            ) : null}

            <WizardNav
              onNext={() => setStep(2)}
              nextDisabled={!typeId || (isOwnTopic && topic.trim().length < 2)}
            />
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="2. Select Date & Time" subtitle="Choose a convenient date and time">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Calendar
                view={view}
                today={today}
                selected={date}
                onPrev={() =>
                  setView((v) =>
                    v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 },
                  )
                }
                onNext={() =>
                  setView((v) =>
                    v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 },
                  )
                }
                onPick={pickDate}
              />

              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  {date ? prettyDate(date) : "Pick a date to see time slots"}
                </p>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading available times…
                  </div>
                ) : date && slots.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No slots available for this day. Try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.map((s) => {
                      const active = time === s.time;
                      const disabled = s.status === "booked";
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={disabled}
                          onClick={() => setTime(s.time)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                            disabled
                              ? "cursor-not-allowed border-destructive/30 bg-destructive/5 text-destructive/70 line-through"
                              : active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-success/40 bg-success/5 text-success hover:bg-success/10",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <Legend />
                <p className="mt-3 text-xs text-muted-foreground">
                  Time Zone: Asia/Dhaka (GMT+6)
                </p>
              </div>
            </div>

            <WizardNav
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextDisabled={!date || !time}
            />
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="3. Your Details" subtitle="Please provide your information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                {(id) => (
                  <Input
                    id={id}
                    autoComplete="name"
                    value={details.full_name}
                    onChange={(e) => patchDetails({ full_name: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Phone Number (Active)" required>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    autoComplete="tel"
                    value={details.phone}
                    onChange={(e) => patchDetails({ phone: e.target.value })}
                    placeholder="+880 1712-345678"
                  />
                )}
              </Field>
              <Field label="WhatsApp Number" required>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    value={details.whatsapp}
                    onChange={(e) => patchDetails({ whatsapp: e.target.value })}
                    placeholder="+880 1712-345678"
                  />
                )}
              </Field>
              <Field label="Age" required>
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={10}
                    max={100}
                    placeholder="Your age"
                    value={details.age || ""}
                    onChange={(e) => patchDetails({ age: Number(e.target.value) || 0 })}
                  />
                )}
              </Field>
              <Field label="Gender" required>
                {(id) => (
                <Select
                  value={details.gender}
                  onValueChange={(v) =>
                    patchDetails({ gender: v as BookingDetails["gender"] })
                  }
                >
                  <SelectTrigger id={id}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g} className="capitalize">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
              </Field>
              <Field label="You are a" required>
                {(id) => (
                <Select
                  value={details.occupation}
                  onValueChange={(v) => patchDetails({ occupation: v })}
                >
                  <SelectTrigger id={id}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
              </Field>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="note">Describe your concern (optional)</Label>
              <Textarea
                id="note"
                rows={3}
                value={details.note}
                onChange={(e) => patchDetails({ note: e.target.value })}
                placeholder="I want to discuss about my career confusion and future plan."
              />
            </div>

            <WizardNav
              onBack={() => setStep(2)}
              onNext={() => {
                if (validateDetails()) goToMentors();
              }}
            />
          </StepCard>
        )}

        {step === 4 && (
          <StepCard title="4. Select Mentor" subtitle="Choose a mentor for your session">
            {loadingMentors ? (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Finding available mentors…
              </div>
            ) : mentors.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No mentors are free at this time. Go back and pick another slot.
              </p>
            ) : (
              <div className="space-y-3">
                {mentors.map((m) => (
                  <MentorRow
                    key={m.id}
                    mentor={m}
                    selected={mentorId === m.id}
                    onSelect={() => setMentorId(m.id)}
                  />
                ))}
              </div>
            )}
            <WizardNav
              onBack={() => setStep(2)}
              onNext={() => setStep(5)}
              nextDisabled={!mentorId}
            />
          </StepCard>
        )}

        {step === 5 && selectedType && date && time && selectedMentor && (
          <StepCard title="5. Review & Pay" subtitle="Please review your appointment">
            <dl className="divide-y divide-border rounded-2xl border border-border">
              <SummaryRow icon={<AppointmentIcon name={selectedType.icon} className="size-4" />} label="Type" value={isOwnTopic && topic ? topic : selectedType.name} />
              <SummaryRow icon={<CalendarDays className="size-4" />} label="Date & Time" value={`${prettyDate(date)}, ${formatSlotLabel(time)}`} />
              <SummaryRow icon={<User className="size-4" />} label="Mentor" value={selectedMentor.full_name} />
              <SummaryRow icon={<Clock className="size-4" />} label="Duration" value={durationLabel(selectedMentor.session_duration)} />
              <SummaryRow icon={<Video className="size-4" />} label="Platform" value="Google Meet" />
              <SummaryRow icon={<CreditCard className="size-4" />} label="Amount" value={formatBDT(selectedMentor.session_price_bdt)} highlight />
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              You will be directed to the payment page to complete your booking.
            </p>

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(4)} disabled={submitting}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Continue to Payment
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </StepCard>
        )}
      </div>
    </div>
  );
}

function durationLabel(min: number | null) {
  if (!min) return "Up to 2 hours";
  if (min % 60 === 0) return min === 60 ? "1 hour" : `${min / 60} hours`;
  return `${min} minutes`;
}

function ProgressBar({ step }: { step: number }) {
  return (
    <ol className="mt-8 flex items-center">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <li key={s.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  done
                    ? "border-success bg-success text-white"
                    : active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <BadgeCheck className="size-4" /> : s.n}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                  step > s.n ? "bg-success" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
      ) : (
        <span />
      )}
      <Button onClick={onNext} disabled={nextDisabled}>
        Next <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

/**
 * Labelled form row.
 *
 * `children` is a render prop rather than a plain node so the generated id can
 * be threaded onto the actual control. Without it the `<Label>` here had no
 * `htmlFor` and did not wrap its input, which left every field in step 3 with
 * no programmatic label at all — a screen reader announced them as bare,
 * unnamed edit boxes and comboboxes. Radix's `SelectTrigger` accepts `id` and
 * renders a real button, so `htmlFor` resolves for the selects too.
 */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children(id)}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Available", cls: "bg-success" },
    { label: "Selected", cls: "bg-primary" },
    { label: "Booked", cls: "bg-destructive" },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-2.5 rounded-full", i.cls)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Calendar({
  view,
  today,
  selected,
  onPrev,
  onNext,
  onPick,
}: {
  view: { year: number; month: number };
  today: string;
  selected: string | null;
  onPrev: () => void;
  onNext: () => void;
  onPick: (d: string) => void;
}) {
  const first = new Date(Date.UTC(view.year, view.month, 1));
  const startDow = (first.getUTCDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </Button>
        <p className="font-semibold text-foreground">
          {MONTHS[view.month]} {view.year}
        </p>
        <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next month">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEK.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const cell = iso(view.year, view.month, d);
          const past = cell < today;
          const active = selected === cell;
          const isToday = cell === today;
          return (
            <button
              key={cell}
              type="button"
              disabled={past}
              onClick={() => onPick(cell)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-sm transition-colors",
                past && "cursor-not-allowed text-muted-foreground/40",
                !past && !active && "hover:bg-secondary",
                active && "bg-primary font-semibold text-primary-foreground",
                !active && isToday && "ring-1 ring-primary/50",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MentorRow({
  mentor,
  selected,
  onSelect,
}: {
  mentor: MentorCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-secondary/40",
      )}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-secondary">
        {mentor.avatar_url ? (
          <Image src={mentor.avatar_url} alt={mentor.full_name} fill sizes="56px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
            {mentor.full_name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold text-foreground">{mentor.full_name}</p>
          {mentor.is_verified ? <BadgeCheck className="size-4 shrink-0 text-primary" /> : null}
        </div>
        {mentor.headline ? (
          <p className="truncate text-sm text-muted-foreground">{mentor.headline}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {mentor.rating ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{mentor.rating.toFixed(1)}</span>
              {mentor.reviews_count ? <span>({mentor.reviews_count})</span> : null}
            </span>
          ) : null}
          <span className="font-medium text-foreground">{formatBDT(mentor.session_price_bdt)}</span>
          <span>{durationLabel(mentor.session_duration)}</span>
        </div>
      </div>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      >
        {selected ? <span className="size-2 rounded-full bg-primary-foreground" /> : null}
      </span>
    </button>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          "text-right text-sm font-medium",
          highlight ? "text-lg font-bold text-primary" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
