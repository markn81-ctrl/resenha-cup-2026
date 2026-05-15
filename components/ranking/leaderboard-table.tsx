import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { LeaderboardRowView } from "@/types/app";
import { StatusBadge } from "@/components/ui/status-badge";
import { Flag } from "@/components/ui/flag";
import { Panel } from "@/components/ui/panel";
import { formatPoints } from "@/lib/utils";

export function LeaderboardTable({
  rows,
  highlightUserId
}: {
  rows: LeaderboardRowView[];
  highlightUserId?: string | null;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-white/8 bg-white/5 text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Pos</th>
              <th className="px-5 py-4">Jogador</th>
              <th className="px-5 py-4">Pontos</th>
              <th className="px-5 py-4">Placar exato</th>
              <th className="px-5 py-4">Vencedores</th>
              <th className="px-5 py-4">Artilheiros</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.userId}
                className={
                  highlightUserId === row.userId
                    ? "border-b border-white/8 bg-brand-400/10"
                    : "border-b border-white/8"
                }
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 font-semibold">
                    #{row.rankPosition}
                    {row.movement > 0 ? (
                      <ArrowUp className="h-4 w-4 text-emerald-300" />
                    ) : row.movement < 0 ? (
                      <ArrowDown className="h-4 w-4 text-rose-300" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{row.name}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      @{row.username}
                    </span>
                    {row.featuredMatch ? (
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        <span>Ultimo palpite</span>
                        <div className="flex items-center gap-1">
                          <Flag
                            countryCode={row.featuredMatch.homeCountryCode}
                            fallbackLabel={row.featuredMatch.homeCode}
                            alt={`Bandeira ${row.featuredMatch.homeCode ?? "time mandante"}`}
                            size={18}
                          />
                          <Flag
                            countryCode={row.featuredMatch.awayCountryCode}
                            fallbackLabel={row.featuredMatch.awayCode}
                            alt={`Bandeira ${row.featuredMatch.awayCode ?? "time visitante"}`}
                            size={18}
                          />
                        </div>
                      </div>
                    ) : null}
                    <StatusBadge tier={row.tier} className="w-fit" />
                  </div>
                </td>
                <td className="px-5 py-4 font-[family-name:var(--font-heading)] text-2xl font-bold">
                  {formatPoints(row.totalPoints)}
                </td>
                <td className="px-5 py-4">{row.exactScores}</td>
                <td className="px-5 py-4">{row.correctWinners}</td>
                <td className="px-5 py-4">{row.correctScorers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
