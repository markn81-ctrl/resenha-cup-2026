"use client";

import { useState } from "react";
import type { MatchCardData } from "@/types/app";
import { PredictionForm } from "@/components/matches/prediction-form";
import { usePredictionLock } from "@/components/matches/use-prediction-lock";
import { cardsEdgeLabels, cardsRangeLabels } from "@/lib/constants";
import { formatPoints } from "@/lib/utils";

type PredictionSnapshot = NonNullable<MatchCardData["prediction"]>;

function predictionOutcomeLabel(match: MatchCardData, prediction: PredictionSnapshot) {
  if (prediction.outcome === "DRAW") {
    return "Empate";
  }

  return prediction.outcome === "HOME_WIN"
    ? `${match.homeCode ?? "Time A"} vence`
    : `${match.awayCode ?? "Time B"} vence`;
}

export function PredictionPanel({ match }: { match: MatchCardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(match);
  const [loadedMatch, setLoadedMatch] = useState<MatchCardData | null>(
    match.homePlayers.length || match.awayPlayers.length ? match : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const lockReached = usePredictionLock(currentMatch.status, currentMatch.lockAt);
  const closed = lockReached || Boolean(currentMatch.result);
  const predictionLabel = currentMatch.prediction
    ? `${currentMatch.prediction.score.home} x ${currentMatch.prediction.score.away}`
    : "Nenhum palpite salvo";
  const lockedPrediction = closed ? currentMatch.prediction : null;

  async function openPredictionForm() {
    if (closed) {
      return;
    }

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
    setSuccessMessage("Palpite salvo. Voce ainda pode editar ate 10 minutos antes do inicio do jogo.");
  }

  if (isOpen && loadedMatch) {
    return <PredictionForm match={loadedMatch} onSaved={closeAfterSave} />;
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/8 bg-white/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            {currentMatch.prediction ? "Seu palpite" : "Palpite"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{predictionLabel}</p>
          <p className="mt-1 text-xs text-slate-400">
            {successMessage ??
              (closed
                ? "Este jogo ja esta travado."
                : "Abra o formulario apenas quando quiser criar ou editar.")}
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading || closed}
          onClick={() => {
            void openPredictionForm();
          }}
          className="rounded-2xl bg-brand-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isLoading
            ? "Carregando..."
            : closed
              ? currentMatch.prediction
                ? "Edicao encerrada"
                : "Palpite fechado"
              : currentMatch.prediction
                ? "Editar palpite"
                : "Abrir palpite"}
        </button>
      </div>

      {lockedPrediction ? (
        <div className="mt-4 grid gap-3 border-t border-white/8 pt-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-950/35 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Placar</p>
            <p className="mt-1 text-lg font-bold text-slate-100">{predictionLabel}</p>
            <p className="mt-1 text-xs text-slate-400">
              {predictionOutcomeLabel(currentMatch, lockedPrediction)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/35 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Artilheiros</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {lockedPrediction.scorers.length
                ? lockedPrediction.scorers.join(", ")
                : "Sem artilheiro"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/35 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Cartoes</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {cardsEdgeLabels[lockedPrediction.cardsEdge]} ·{" "}
              {cardsRangeLabels[lockedPrediction.cardsRange]}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/35 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Pontos</p>
            <p className="mt-1 text-lg font-bold text-brand-100">
              {currentMatch.status === "FINISHED"
                ? `${formatPoints(lockedPrediction.points ?? 0)} pts`
                : "Aguardando resultado"}
            </p>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-brand-100 sm:basis-full">{error}</p> : null}
    </div>
  );
}
