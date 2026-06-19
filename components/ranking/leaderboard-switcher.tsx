"use client";

import { useState } from "react";
import type { LeaderboardRowView } from "@/types/app";
import { LeaderboardTable } from "@/components/ranking/leaderboard-table";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type RankingKey = "overall" | "knockout";

type LeaderboardSwitcherProps = {
  overall: LeaderboardRowView[];
  knockout: LeaderboardRowView[];
  highlightUserId?: string | null;
};

const rankingMeta: Record<
  RankingKey,
  {
    label: string;
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  overall: {
    label: "Ranking geral",
    eyebrow: "Ranking",
    title: "Classificacao geral",
    description: "Soma toda a campanha: fase de grupos e mata-mata."
  },
  knockout: {
    label: "Ranking Mata-Mata",
    eyebrow: "Disputa do pote",
    title: "Ranking Mata-Mata",
    description: "Recorte separado dos jogos eliminatorios, a disputa que vai valer o pote."
  }
};

export function LeaderboardSwitcher({
  overall,
  knockout,
  highlightUserId
}: LeaderboardSwitcherProps) {
  const [activeRanking, setActiveRanking] = useState<RankingKey>("overall");
  const activeRows = activeRanking === "overall" ? overall : knockout;
  const activeMeta = rankingMeta[activeRanking];

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

      <LeaderboardTable rows={activeRows} highlightUserId={highlightUserId} />
    </section>
  );
}
