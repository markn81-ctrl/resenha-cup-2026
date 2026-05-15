import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { LeaderboardScope, PlayerTier } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { Panel } from "@/components/ui/panel";
import { formatPoints } from "@/lib/utils";

export function OverviewCards({
  standing,
  rivalry,
  topFive
}: {
  standing: {
    position: number;
    totalPoints: number;
    movement: number;
    pointsToNext: number | null;
    tier: PlayerTier;
  };
  rivalry: {
    rivalId: string;
    name: string;
    username: string;
    image?: string | null;
    position: number;
    points: number;
    pointsGap: number;
    score: number;
    scope: LeaderboardScope;
    trendLabel: string;
  } | null;
  topFive: Array<{
    id: string;
    name: string;
    username: string;
    points: number;
    tier: PlayerTier;
  }>;
}) {
  const movementIcon =
    standing.movement > 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-300" />
    ) : standing.movement < 0 ? (
      <TrendingDown className="h-4 w-4 text-rose-300" />
    ) : (
      <Minus className="h-4 w-4 text-slate-300" />
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel className="overflow-hidden">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Posicao atual</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-[family-name:var(--font-heading)] text-5xl font-bold">
                #{standing.position}
              </span>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  {movementIcon}
                  {standing.movement > 0
                    ? `Subiu ${standing.movement}`
                    : standing.movement < 0
                      ? `Caiu ${Math.abs(standing.movement)}`
                      : "Manteve"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pontuacao</p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-5xl font-bold">
              {formatPoints(standing.totalPoints)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {standing.pointsToNext
                ? `${formatPoints(standing.pointsToNext)} pts para o proximo`
                : "Voce esta na lideranca"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Status do jogador</p>
            <div className="mt-3">
              <StatusBadge tier={standing.tier} />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Sua faixa de performance atual mostra como a mesa esta te enxergando.
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Preview top 5</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Corrida pela ponta
          </h3>
        </div>

        <div className="mt-4 space-y-3">
          {topFive.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="text-sm text-slate-400">#{index + 1}</p>
                <p className="font-semibold">{row.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">@{row.username}</p>
              </div>
              <div className="text-right">
                <StatusBadge tier={row.tier} className="mb-2" />
                <p className="font-[family-name:var(--font-heading)] text-2xl font-bold">
                  {formatPoints(row.points)}
                </p>
              </div>
            </div>
          ))}
        </div>
        {rivalry ? (
          <div className="mt-4 rounded-2xl border border-accent-300/25 bg-accent-300/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-accent-100">Rival da vez</p>
            <p className="mt-1 font-semibold text-white">{rivalry.name}</p>
            <p className="text-sm text-slate-300">
              Gap de {formatPoints(rivalry.pointsGap)} pts e score {Math.round(rivalry.score)} de rivalidade.
            </p>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
