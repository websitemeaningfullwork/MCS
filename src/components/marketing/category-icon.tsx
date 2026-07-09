import {
  Book,
  BookOpen,
  Brain,
  Briefcase,
  Code,
  Gift,
  GraduationCap,
  Languages,
  Radio,
  Route,
  Sparkles,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  book: Book,
  code: Code,
  brain: Brain,
  languages: Languages,
  briefcase: Briefcase,
  zap: Zap,
  users: Users,
  gift: Gift,
  "user-round": UserRound,
  radio: Radio,
  route: Route,
};

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICONS[name] ?? Sparkles;
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = getIcon(name);
  return <Icon className={className} aria-hidden="true" />;
}
