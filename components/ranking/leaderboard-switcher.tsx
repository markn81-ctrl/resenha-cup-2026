"use client";

import { useState } from "react";
import type { LeaderboardRowView } from "@/types/app";
import { LeaderboardTable } from "@/components/ranking/leaderboard-table";
import { Panel } from "@/components/ui/panel";
import { cn, formatPoints } from "@/lib/utils";

type RankingKey = "overall" | "knockout";

type LeaderboardSwitcherProps = {
  overall: LeaderboardRowView[];
  knockout: LeaderboardRowView[];
  highlightUserId?: string | null;
  defaultRanking?: RankingKey;
};

const rankingMeta: Record<
  RankingKey,
  {
    label: string;
    eyebrow: string;
    title: string;
    description: string;
    emptyMessage: string;
  }
> = {
  overall: {
    label: "Ranking geral",
    eyebrow: "Historico da campanha",
    title: "Ranking geral",
    description: "Consulta da corrida inicial e da campanha completa. A disputa que vale o pote agora esta no Mata-Mata.",
    emptyMessage:
      "Ranking limpo por enquanto. Quando os primeiros palpites forem pontuados, a briga pela ponta aparece aqui."
  },
  knockout: {
    label: "Ranking Mata-Mata",
    eyebrow: "Disputa que vale agora",
    title: "Ranking Mata-Mata",
    description: "Recorte dos jogos eliminatorios: quem largou bem, quem encostou e quem precisa reagir pelo pote.",
    emptyMessage:
      "A disputa do pote comeca assim que o primeiro jogo do mata-mata for pontuado."
  }
};

export function LeaderboardSwitcher({
  overall,
  knockout,
  highlightUserId,
  defaultRanking = "overall"
}: LeaderboardSwitcherProps) {
  const [activeRanking, setActiveRanking] = useState<RankingKey>(defaultRanking);
  const activeRows = activeRanking === "overall" ? overall : knockout;
  const activeMeta = rankingMeta[activeRanking];
  const leader = activeRows[0];
  const second = activeRows[1];
  const leaderGap = leader && second ? leader.totalPoints - second.totalPoints : null;

  return (
    <section className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {activeMeta.eyebrow}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              {activeMeta.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {activeMeta.description}
            </p>
            {leader ? (
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <span className="rounded-full bg-accent-300/15 px-3 py-1.5 text-accent-100">
                  Lider: {leader.name}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                  {formatPoints(leader.totalPoints)} pts
                </span>
                {leaderGap !== null ? (
                  <span className="rounded-full bg-brand-400/10 px-3 py-1.5 text-brand-100">
                    {leaderGap === 0 ? "Topo empatado" : `${formatPoints(leaderGap)} pts para o 2o`}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-1">
            {(Object.keys(rankingMeta) as RankingKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveRanking(key)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  activeRanking === key
                    ? "bg-brand-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                )}
              >
                {rankingMeta[key].label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <LeaderboardTable
        rows={activeRows}
        highlightUserId={highlightUserId}
        emptyMessage={activeMeta.emptyMessage}
        showPrizeBadges={activeRanking === "knockout"}
        showStreakProgress={activeRanking === "knockout"}
      />
    </section>
  );
}
