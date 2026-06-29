import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchDate(date: Date | string, timezone = "America/Sao_Paulo") {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "dd 'de' MMM, HH:mm", { locale: ptBR });
}

export function formatLongDate(date: Date | string, timezone = "America/Sao_Paulo") {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}

export function relativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR
  });
}

export function isLocked(lockAt: Date | string) {
  return isPast(new Date(lockAt));
}

export function formatPoints(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1
  }).format(value);
}

export function formatRankPosition(position?: number | null) {
  return position ? `${position}º` : "-";
}

export function getDisplayName(args: {
  name?: string | null;
  email?: string | null;
  username?: string | null;
}) {
  if (args.name?.trim()) {
    return args.name.trim();
  }

  if (args.email?.includes("@")) {
    const localPart = args.email.split("@")[0];
    const normalized = localPart.replace(/[._-]+/g, " ").trim();
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (args.username?.trim()) {
    return args.username.trim();
  }

  return "Participante";
}

export function getAvatarFallback(value?: string | null) {
  if (!value?.trim()) {
    return "RC";
  }

  const pieces = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");

  return pieces || "RC";
}
