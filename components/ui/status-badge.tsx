import { PlayerTier } from "@prisma/client";
import { playerTierMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

const palette: Record<PlayerTier, string> = {
  LEGENDARY: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  GOOD: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  AVERAGE: "bg-yellow-400/15 text-yellow-200 ring-yellow-400/30",
  POOR: "bg-rose-400/15 text-rose-200 ring-rose-400/30"
};

export function StatusBadge({
  tier,
  className
}: {
  tier: PlayerTier;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ring-1",
        palette[tier],
        className
      )}
    >
      {playerTierMeta[tier].label}
    </span>
  );
}
