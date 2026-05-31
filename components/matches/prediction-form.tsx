"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { CardsEdge, CardsRange, MatchStatus, PredictionOutcome } from "@prisma/client";
import { Flag } from "@/components/ui/flag";
import { LoadingButton } from "@/components/ui/loading-button";
import { playerPositionShortLabels } from "@/lib/constants";
import type { MatchCardData } from "@/types/app";

type PredictionSnapshot = NonNullable<MatchCardData["prediction"]>;

const outcomes = [
  { value: PredictionOutcome.HOME_WIN, label: "Time A vence" },
  { value: PredictionOutcome.DRAW, label: "Empate" },
  { value: PredictionOutcome.AWAY_WIN, label: "Time B vence" }
];

const cardsEdges = [
  { value: CardsEdge.HOME, label: "Time A" },
  { value: CardsEdge.AWAY, label: "Time B" },
  { value: CardsEdge.EQUAL, label: "Igual" }
];

const cardsRanges = [
  { value: CardsRange.ZERO, label: "0" },
  { value: CardsRange.ONE_TWO, label: "1-2" },
  { value: CardsRange.THREE_FOUR, label: "3-4" },
  { value: CardsRange.FIVE_PLUS, label: "5+" }
];

function deriveScoreOutcome(score: PredictionSnapshot["score"]) {
  if (score.home > score.away) {
    return PredictionOutcome.HOME_WIN;
  }

  if (score.home < score.away) {
    return PredictionOutcome.AWAY_WIN;
  }

  return PredictionOutcome.DRAW;
}

function getOutcomeLabel(outcome: PredictionOutcome) {
  return outcomes.find((item) => item.value === outcome)?.label ?? "resultado escolhido";
}

export function PredictionForm({
  match,
  onSaved
}: {
  match: MatchCardData;
  onSaved?: (prediction: PredictionSnapshot) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasSavedPrediction, setHasSavedPrediction] = useState(Boolean(match.prediction));
  const [pending, startTransition] = useTransition();
  const isEditingPrediction = Boolean(match.prediction) || hasSavedPrediction;
  const locked = match.status !== MatchStatus.SCHEDULED;
  const hasPlayerCatalog = match.homePlayers.length > 0 || match.awayPlayers.length > 0;

  const scorerGroups = [
    {
      label: `Time A · ${match.homeTeam}`,
      options: match.homePlayers
    },
    {
      label: `Time B · ${match.awayTeam}`,
      options: match.awayPlayers
    }
  ].filter((group) => group.options.length > 0);

  return (
    <form
      noValidate
      onChange={() => {
        if (validationError) {
          setValidationError(null);
        }
      }}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const prediction: PredictionSnapshot = {
          outcome: formData.get("outcome") as PredictionOutcome,
          score: {
            home: Number(formData.get("homeScore")),
            away: Number(formData.get("awayScore"))
          },
          scorers: Array.from(
            new Set(
              [formData.get("scorer1"), formData.get("scorer2")]
                .map((value) => String(value ?? "").trim())
                .filter(Boolean)
            )
          ).slice(0, 2),
          cardsEdge: formData.get("cardsEdge") as CardsEdge,
          cardsRange: formData.get("cardsRange") as CardsRange,
          points: match.prediction?.points
        };
        const scoreOutcome = deriveScoreOutcome(prediction.score);

        if (prediction.outcome !== scoreOutcome) {
          setMessage(null);
          setValidationError(
            `O placar ${prediction.score.home} x ${prediction.score.away} indica "${getOutcomeLabel(
              scoreOutcome
            )}", mas voce escolheu "${getOutcomeLabel(prediction.outcome)}". Ajuste o vencedor ou o placar para salvar.`
          );
          return;
        }

        startTransition(async () => {
          setMessage(null);
          setValidationError(null);

          const response = await fetch("/api/predictions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              matchId: match.id,
              outcome: prediction.outcome,
              score: prediction.score,
              scorers: prediction.scorers,
              cardsEdge: prediction.cardsEdge,
              cardsRange: prediction.cardsRange
            })
          });

          const payload = await response.json();
          if (response.ok) {
            setHasSavedPrediction(true);
            onSaved?.(prediction);
            return;
          }

          setMessage(payload.error ?? "Erro ao salvar.");
        });
      }}
      className="mt-4 grid gap-3"
    >
      <div className="grid gap-3 rounded-3xl border border-white/8 bg-white/5 p-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
            A
          </span>
          <Flag
            countryCode={match.homeCountryCode}
            fallbackLabel={match.homeCode}
            alt={`Bandeira de ${match.homeTeam}`}
            size={36}
          />
          <div>
            <p className="text-sm font-semibold text-slate-100">{match.homeTeam}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {match.homeCode ?? "HOME"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
            B
          </span>
          <Flag
            countryCode={match.awayCountryCode}
            fallbackLabel={match.awayCode}
            alt={`Bandeira de ${match.awayTeam}`}
            size={36}
          />
          <div>
            <p className="text-sm font-semibold text-slate-100">{match.awayTeam}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {match.awayCode ?? "AWAY"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <select
          name="outcome"
          defaultValue={match.prediction?.outcome ?? PredictionOutcome.HOME_WIN}
          disabled={locked || pending}
          aria-invalid={Boolean(validationError)}
          className={`rounded-2xl border bg-slate-950/40 px-4 py-3 ${
            validationError ? "border-rose-400/80 ring-2 ring-rose-500/20" : "border-white/10"
          }`}
        >
          {outcomes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="homeScore"
            type="number"
            min={0}
            max={20}
            defaultValue={match.prediction?.score.home ?? 1}
            disabled={locked || pending}
            aria-invalid={Boolean(validationError)}
            className={`rounded-2xl border bg-slate-950/40 px-4 py-3 ${
              validationError ? "border-rose-400/80 ring-2 ring-rose-500/20" : "border-white/10"
            }`}
          />
          <input
            name="awayScore"
            type="number"
            min={0}
            max={20}
            defaultValue={match.prediction?.score.away ?? 0}
            disabled={locked || pending}
            aria-invalid={Boolean(validationError)}
            className={`rounded-2xl border bg-slate-950/40 px-4 py-3 ${
              validationError ? "border-rose-400/80 ring-2 ring-rose-500/20" : "border-white/10"
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            name="scorer1"
            defaultValue={match.prediction?.scorers[0] ?? ""}
            disabled={locked || pending || !hasPlayerCatalog}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <option value="">Artilheiro 1</option>
            {scorerGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name} · {playerPositionShortLabels[player.position]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            name="scorer2"
            defaultValue={match.prediction?.scorers[1] ?? ""}
            disabled={locked || pending || !hasPlayerCatalog}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <option value="">Artilheiro 2</option>
            {scorerGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((player) => (
                  <option key={player.id} value={player.name}>
                    {player.name} · {playerPositionShortLabels[player.position]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <select
          name="cardsEdge"
          defaultValue={match.prediction?.cardsEdge ?? CardsEdge.EQUAL}
          disabled={locked || pending}
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
        >
          {cardsEdges.map((item) => (
            <option key={item.value} value={item.value}>
              Mais amarelos: {item.label}
            </option>
          ))}
        </select>

        <select
          name="cardsRange"
          defaultValue={match.prediction?.cardsRange ?? CardsRange.THREE_FOUR}
          disabled={locked || pending}
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
        >
          {cardsRanges.map((item) => (
            <option key={item.value} value={item.value}>
              Faixa de cartoes: {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-300">
            {locked
              ? "Palpite travado automaticamente."
              : "Os palpites fecham 2 horas antes do jogo."}
          </p>
          {!hasPlayerCatalog ? (
            <p className="text-xs text-slate-500">
              Lista de artilheiros libera quando as selecoes do jogo tiverem elenco cadastrado.
            </p>
          ) : null}
        </div>
        <LoadingButton
          type="submit"
          disabled={locked || pending}
          loading={pending}
          loadingLabel={isEditingPrediction ? "Salvando alteracoes..." : "Salvando..."}
          className="w-full rounded-2xl bg-brand-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {locked
            ? "Travado"
            : isEditingPrediction
                ? "Salvar alteracoes"
                : "Salvar palpite"}
        </LoadingButton>
      </div>

      {validationError ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/60 bg-rose-500/12 px-4 py-3 text-sm font-semibold leading-6 text-rose-100"
        >
          {validationError}
        </div>
      ) : null}

      {message ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/60 bg-rose-500/12 px-4 py-3 text-sm font-semibold leading-6 text-rose-100"
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
