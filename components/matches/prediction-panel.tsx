"use client";

import { useState } from "react";
import { MatchStatus } from "@prisma/client";
import type { MatchCardData } from "@/types/app";
import { PredictionForm } from "@/components/matches/prediction-form";

type PredictionSnapshot = NonNullable<MatchCardData["prediction"]>;

export function PredictionPanel({ match }: { match: MatchCardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(match);
  const [loadedMatch, setLoadedMatch] = useState<MatchCardData | null>(
    match.homePlayers.length || match.awayPlayers.length ? match : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const locked = currentMatch.status !== MatchStatus.SCHEDULED;
  const predictionLabel = currentMatch.prediction
    ? `${currentMatch.prediction.score.home} x ${currentMatch.prediction.score.away}`
    : "Nenhum palpite salvo";

  async function openPredictionForm() {
    setError(null);
    setSuccessMessage(null);

    if (loadedMatch) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/matches/${currentMatch.id}`, {
        method: "GET"
      });

      if (!response.ok) {
        setError("Nao foi possivel carregar o formulario agora.");
        return;
      }

      const data = (await response.json()) as MatchCardData;
      const nextMatch = {
        ...data,
        startsAt: new Date(data.startsAt),
        lockAt: new Date(data.lockAt)
      };
      setCurrentMatch(nextMatch);
      setLoadedMatch(nextMatch);
      setIsOpen(true);
    } catch {
      setError("Nao foi possivel carregar o formulario agora.");
    } finally {
      setIsLoading(false);
    }
  }

  function closeAfterSave(prediction: PredictionSnapshot) {
    const nextMatch = {
      ...(loadedMatch ?? currentMatch),
      prediction
    };

    setCurrentMatch(nextMatch);
    setLoadedMatch(nextMatch);
    setIsOpen(false);
    setSuccessMessage("Palpite salvo. Voce ainda pode editar ate 2 horas antes do inicio do jogo.");
  }

  if (isOpen && loadedMatch) {
    return <PredictionForm match={loadedMatch} onSaved={closeAfterSave} />;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-white/8 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          {currentMatch.prediction ? "Seu palpite" : "Palpite"}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{predictionLabel}</p>
        <p className="mt-1 text-xs text-slate-400">
          {successMessage ??
            (locked
            ? "Este jogo ja esta travado."
              : "Abra o formulario apenas quando quiser criar ou editar.")}
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
            : currentMatch.prediction
              ? "Editar palpite"
              : "Abrir palpite"}
      </button>
      {error ? <p className="text-sm text-brand-100 sm:basis-full">{error}</p> : null}
    </div>
  );
}
