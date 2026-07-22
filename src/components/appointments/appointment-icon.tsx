"use client";

import {
  Briefcase,
  BookOpen,
  Compass,
  GraduationCap,
  HeartPulse,
  MessagesSquare,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

/** String-key → icon registry (Server Components pass a key, resolved here). */
const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  "heart-pulse": HeartPulse,
  "messages-square": MessagesSquare,
  sparkles: Sparkles,
  video: Video,
};

export const APPOINTMENT_ICON_KEYS = Object.keys(ICONS);

export function AppointmentIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = ICONS[name ?? "compass"] ?? Compass;
  return <Icon className={className} />;
}
