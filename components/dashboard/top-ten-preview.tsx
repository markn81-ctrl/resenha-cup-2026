import { Crown } from "lucide-react";
import { PlayerTier } from "@prisma/client";
import { SmartNavLink } from "@/components/layout/smart-nav-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Panel } from "@/components/ui/panel";
import { cn, formatPoints, formatRankPosition } from "@/lib/utils";

type TopTenRow = {
  id: string;
  name: string;
  username: string;
  points: number;
  tier: PlayerTier;
};

export function TopTenPreview({
  rows,
  currentUserId
}: {
  rows: TopTenRow[];
  currentUserId: string;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Preview TOP 10</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Corrida pela ponta do Mata-Mata
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            A briga que vale o pote aparece aqui: quem disparou, quem encostou e quem precisa reagir rapido.
          </p>
        </div>
        <SmartNavLink
          href="/league"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Ver ranking completo
        </SmartNavLink>
      </div>

      {!rows.length ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-5 text-sm text-slate-300">
          O TOP 10 do Mata-Mata aparece assim que os primeiros palpites forem pontuados.
        </div>
      ) : (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {rows.map((row, index) => {
            const isCurrentUser = row.id === currentUserId;

            return (
              <div
                key={row.id}
                className={cn(
                  "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border px-3 py-3",
                  isCurrentUser
                    ? "border-brand-300/35 bg-brand-400/10"
                    : "border-white/8 bg-white/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl font-[family-name:var(--font-heading)] text-lg font-bold",
                    index === 0
                      ? "bg-accent-300 text-slate-950"
                      : "bg-slate-950/45 text-slate-200"
                  )}
                >
                  {index === 0 ? <Crown className="h-5 w-5" /> : formatRankPosition(index + 1)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{row.name}</p>
                    {isCurrentUser ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">
                        Voce
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-slate-400">@{row.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-[family-name:var(--font-heading)] text-xl font-bold">
                    {formatPoints(row.points)}
                  </p>
                  <StatusBadge tier={row.tier} className="mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
