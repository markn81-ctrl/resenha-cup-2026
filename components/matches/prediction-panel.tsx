"use client";

import { useState } from "react";
import { MatchStatus } from "@prisma/client";
import type { MatchCardData } from "@/types/app";
import { PredictionForm } from "@/components/matches/prediction-form";

export function PredictionPanel({ match }: { match: MatchCardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedMatch, setLoadedMatch] = useState<MatchCardData | null>(
    match.homePlayers.length || match.awayPlayers.length ? match : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = match.status !== MatchStatus.SCHEDULED;
  const predictionLabel = match.prediction
    ? `${match.prediction.score.home} x ${match.prediction.score.away}`
    : "Nenhum palpite salvo";

  async function openPredictionForm() {
    setError(null);

    if (loadedMatch) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/matches/${match.id}`, {
        method: "GET"
      });

      if (!response.ok) {
        setError("Nao foi possivel carregar o formulario agora.");
        return;
      }

      const data = (await response.json()) as MatchCardData;
      setLoadedMatch({
        ...data,
        startsAt: new Date(data.startsAt),
        lockAt: new Date(data.lockAt)
      });
      setIsOpen(true);
    } catch {
      setError("Nao foi possivel carregar o formulario agora.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isOpen && loadedMatch) {
    return <PredictionForm match={loadedMatch} />;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-white/8 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          {match.prediction ? "Seu palpite" : "Palpite"}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{predictionLabel}</p>
        <p className="mt-1 text-xs text-slate-400">
          {locked
            ? "Este jogo ja esta travado."
            : "Abra o formulario apenas quando quiser criar ou editar."}
        </p>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          void openPredictionForm();
        }}
        className="rounded-2xl bg-brand-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-300"
      >
        {isLoading
          ? "Carregando..."
          : locked
            ? "Ver palpite"
            : match.prediction
              ? "Editar palpite"
              : "Abrir palpite"}
      </button>
      {error ? <p className="text-sm text-brand-100 sm:basis-full">{error}</p> : null}
    </div>
  );
}
