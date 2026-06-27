import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { LeaderboardRowView } from "@/types/app";
import { StatusBadge } from "@/components/ui/status-badge";
import { Flag } from "@/components/ui/flag";
import { Panel } from "@/components/ui/panel";
import { formatPoints } from "@/lib/utils";

export function LeaderboardTable({
  rows,
  highlightUserId,
  emptyMessage = "Ranking limpo por enquanto. Quando os primeiros palpites forem pontuados, a briga pela ponta aparece aqui."
}: {
  rows: LeaderboardRowView[];
  highlightUserId?: string | null;
  emptyMessage?: string;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="space-y-3 p-3 md:hidden">
        {!rows.length ? (
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5 text-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : null}
        {rows.map((row) => (
          <div
            key={row.userId}
            className={
              highlightUserId === row.userId
                ? "rounded-2xl border border-brand-300/30 bg-brand-400/10 p-4"
                : "rounded-2xl border border-white/8 bg-white/5 p-4"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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
                <p className="mt-2 truncate font-semibold">{row.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  @{row.username}
                </p>
              </div>
              <div className="text-right">
                <p className="font-[family-name:var(--font-heading)] text-2xl font-bold">
                  {formatPoints(row.totalPoints)}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">pontos</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge tier={row.tier} className="w-fit" />
              {row.featuredMatch ? (
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <span>Ultimo palpite</span>
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
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-2xl bg-slate-950/35 p-3">
                <p className="text-lg font-bold">{row.exactScores}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  exat.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/35 p-3">
                <p className="text-lg font-bold">{row.correctWinners}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  venc.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/35 p-3">
                <p className="text-lg font-bold">{row.correctScorers}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  gols
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/35 p-3">
                <p className="text-lg font-bold">{row.correctCards}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  cart.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left">
          <thead className="border-b border-white/8 bg-white/5 text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Pos</th>
              <th className="px-5 py-4">Jogador</th>
              <th className="px-5 py-4">Pontos</th>
              <th className="px-5 py-4">Placar exato</th>
              <th className="px-5 py-4">Vencedores</th>
              <th className="px-5 py-4">Artilheiros</th>
              <th className="px-5 py-4">Cartões</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
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
                <td className="px-5 py-4">{row.correctCards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
