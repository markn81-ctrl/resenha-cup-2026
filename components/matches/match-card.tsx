import { MatchStatus } from "@prisma/client";
import { phaseLabels } from "@/lib/constants";
import { formatLongDate } from "@/lib/utils";
import type { MatchCardData } from "@/types/app";
import { Panel } from "@/components/ui/panel";
import { Flag } from "@/components/ui/flag";
import { PredictionForm } from "@/components/matches/prediction-form";

export function MatchCard({ match }: { match: MatchCardData }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
            <span>Jogo {match.number}</span>
            <span>{phaseLabels[match.phase]}</span>
            {match.groupKey ? <span>Grupo {match.groupKey}</span> : null}
          </div>
          <div className="mt-3 grid gap-3 sm:flex sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                A
              </span>
              <Flag
                countryCode={match.homeCountryCode}
                fallbackLabel={match.homeCode}
                alt={`Bandeira de ${match.homeTeam}`}
                size={48}
              />
              <div>
                <p className="text-lg font-semibold sm:text-xl">{match.homeTeam}</p>
                <p className="text-sm text-slate-400">{match.homeCode ?? "HOME"}</p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
              vs
            </span>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                B
              </span>
              <Flag
                countryCode={match.awayCountryCode}
                fallbackLabel={match.awayCode}
                alt={`Bandeira de ${match.awayTeam}`}
                size={48}
              />
              <div>
                <p className="text-lg font-semibold sm:text-xl">{match.awayTeam}</p>
                <p className="text-sm text-slate-400">{match.awayCode ?? "AWAY"}</p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-300">
            {formatLongDate(match.startsAt)} · {match.venue ?? "Estadio a definir"}
            {match.city ? ` · ${match.city}` : ""}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            match.status === MatchStatus.FINISHED
              ? "bg-sky-400/15 text-sky-300"
              : match.status === MatchStatus.LOCKED
                ? "bg-amber-400/15 text-amber-200"
                : "bg-emerald-400/15 text-emerald-200"
          }`}
        >
          {match.status === MatchStatus.FINISHED
            ? "Finalizado"
            : match.status === MatchStatus.LOCKED
              ? "Travado"
              : "Aberto"}
        </span>
      </div>

      {match.result ? (
        <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Resultado oficial</p>
          <p className="mt-2 text-lg font-semibold">
            {match.result.score.home} x {match.result.score.away}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Gols: {match.result.scorers.length ? match.result.scorers.join(", ") : "Sem gols"}
          </p>
        </div>
      ) : null}

      <PredictionForm match={match} />
    </Panel>
  );
}
