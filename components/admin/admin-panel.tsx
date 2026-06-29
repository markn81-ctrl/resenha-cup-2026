"use client";

import { CardsEdge, CardsRange, LeaderboardScope } from "@prisma/client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminKnockoutMatchupsView,
  AdminOfficialResultView,
  AdminSimulationView,
  AdminView
} from "@/types/app";
import { Panel } from "@/components/ui/panel";
import { Flag } from "@/components/ui/flag";
import { LoadingButton } from "@/components/ui/loading-button";
import { phaseLabels } from "@/lib/constants";
import { formatLongDate, formatPoints, formatRankPosition, relativeTime } from "@/lib/utils";

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

type SimulationScoreInput = number | "";

const matchupStatusLabels: Record<AdminKnockoutMatchupsView["matches"][number]["status"], string> = {
  READY: "Pronto para aplicar",
  UNCHANGED: "Ja atualizado",
  UNAVAILABLE: "Aguardando FIFA",
  MISSING_TEAM: "Selecao nao cadastrada",
  FINISHED: "Finalizado"
};

const matchupStatusClasses: Record<AdminKnockoutMatchupsView["matches"][number]["status"], string> = {
  READY: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  UNCHANGED: "border-sky-300/25 bg-sky-400/10 text-sky-100",
  UNAVAILABLE: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  MISSING_TEAM: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  FINISHED: "border-white/10 bg-white/5 text-slate-300"
};

function getDefaultSimulationMatch(matches: AdminView["simulationMatches"]) {
  return matches.find((match) => !match.result) ?? matches[0] ?? null;
}

export function AdminPanel({ data }: { data: AdminView }) {
  const router = useRouter();
  const initialSimulationMatch = getDefaultSimulationMatch(data.simulationMatches);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState(data.pendingUsers);
  const [approvalAction, setApprovalAction] = useState<{
    userId: string;
    approvalStatus: "APPROVED" | "REJECTED";
  } | null>(null);
  const [aiScope, setAiScope] = useState<LeaderboardScope>(LeaderboardScope.OVERALL);
  const [launchResetFeedback, setLaunchResetFeedback] = useState<string | null>(null);
  const [simulationMatchId, setSimulationMatchId] = useState<string>(
    initialSimulationMatch?.id ?? ""
  );
  const [manualSimulationMatchId, setManualSimulationMatchId] = useState<string | null>(null);
  const [simulationHomeScore, setSimulationHomeScore] = useState<SimulationScoreInput>("");
  const [simulationAwayScore, setSimulationAwayScore] = useState<SimulationScoreInput>("");
  const [simulationCardsEdge, setSimulationCardsEdge] = useState<CardsEdge | "">("");
  const [simulationCardsRange, setSimulationCardsRange] = useState<CardsRange | "">("");
  const [simulationScorers, setSimulationScorers] = useState("");
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);
  const [simulationPreview, setSimulationPreview] = useState<AdminSimulationView | null>(null);
  const [officialResult, setOfficialResult] = useState<AdminOfficialResultView | null>(null);
  const [knockoutMatchups, setKnockoutMatchups] = useState<AdminKnockoutMatchupsView | null>(null);
  const [knockoutFeedback, setKnockoutFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPendingUsers(data.pendingUsers);
  }, [data.pendingUsers]);

  useEffect(() => {
    const currentMatch =
      data.simulationMatches.find((match) => match.id === simulationMatchId) ?? null;

    if (currentMatch) {
      if (manualSimulationMatchId === simulationMatchId) {
        return;
      }

      if (!currentMatch.result) {
        return;
      }
    }

    const nextMatch = getDefaultSimulationMatch(data.simulationMatches);

    if (!nextMatch || nextMatch.id === simulationMatchId) {
      return;
    }

    setSimulationMatchId(nextMatch.id);
    setManualSimulationMatchId(null);
    resetSimulationFields();
    setOfficialResult(null);
    invalidateSimulation();
  }, [data.simulationMatches, manualSimulationMatchId, simulationMatchId]);

  const selectedSimulationMatch =
    data.simulationMatches.find((match) => match.id === simulationMatchId) ?? null;
  const correctionMode = Boolean(selectedSimulationMatch?.result);

  const simulationInputReady =
    Boolean(officialResult) &&
    simulationHomeScore !== "" &&
    simulationAwayScore !== "" &&
    simulationCardsEdge !== "" &&
    simulationCardsRange !== "";

  function resetSimulationFields() {
    setSimulationHomeScore("");
    setSimulationAwayScore("");
    setSimulationScorers("");
    setSimulationCardsEdge("");
    setSimulationCardsRange("");
  }

  function getSimulationPayload() {
    if (
      !simulationMatchId ||
      simulationHomeScore === "" ||
      simulationAwayScore === "" ||
      simulationCardsEdge === "" ||
      simulationCardsRange === ""
    ) {
      return null;
    }

    return {
      matchId: simulationMatchId,
      score: {
        home: simulationHomeScore,
        away: simulationAwayScore
      },
      scorers: simulationScorers
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      cardsEdge: simulationCardsEdge,
      cardsRange: simulationCardsRange
    };
  }

  function updateApproval(userId: string, approvalStatus: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      setFeedback(null);
      setApprovalAction({ userId, approvalStatus });

      try {
        const response = await fetch("/api/admin/approve", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            approvalStatus
          })
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setFeedback(payload?.error ?? "Falha ao atualizar aprovacao.");
          return;
        }

        setPendingUsers((users) => users.filter((user) => user.id !== userId));
        setFeedback(
          approvalStatus === "APPROVED"
            ? "Usuario aprovado e liberado para entrar."
            : "Usuario recusado."
        );
        router.refresh();
      } catch {
        setFeedback("Nao foi possivel falar com o servidor agora. Tente novamente.");
      } finally {
        setApprovalAction(null);
      }
    });
  }

  function fetchKnockoutMatchups() {
    startTransition(async () => {
      setKnockoutFeedback(null);

      try {
        const response = await fetch("/api/admin/knockout-matchups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action: "preview" })
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setKnockoutMatchups(null);
          setKnockoutFeedback(
            payload?.error ?? "Nao foi possivel buscar confrontos na FIFA."
          );
          return;
        }

        setKnockoutMatchups(payload.preview as AdminKnockoutMatchupsView);
        setKnockoutFeedback("Confrontos consultados. Confira antes de aplicar.");
      } catch {
        setKnockoutMatchups(null);
        setKnockoutFeedback("Nao foi possivel falar com a FIFA agora. Tente novamente.");
      }
    });
  }

  function applyKnockoutMatchups() {
    const readyCount = knockoutMatchups?.summary.ready ?? 0;
    const confirmed = window.confirm(
      `Aplicar ${readyCount} confronto(s) do mata-mata retornado(s) pela FIFA? Palpites e pontuacao nao serao alterados.`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setKnockoutFeedback(null);

      try {
        const response = await fetch("/api/admin/knockout-matchups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action: "apply" })
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setKnockoutFeedback(
            payload?.error ?? "Nao foi possivel aplicar os confrontos."
          );
          return;
        }

        setKnockoutMatchups(payload.preview as AdminKnockoutMatchupsView);
        setKnockoutFeedback(
          `${payload.applied ?? 0} confronto(s) atualizado(s). Palpites preservados.`
        );
        router.refresh();
      } catch {
        setKnockoutFeedback("Nao foi possivel aplicar os confrontos agora. Tente novamente.");
      }
    });
  }

  function invalidateSimulation() {
    setSimulationPreview(null);
    setSimulationFeedback(null);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lancamento</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Limpar dados de teste
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Remove ranking, feed, notificacoes, palpites, resultados simulados e usuarios fake do banco ativo. Sua conta admin e outros admins sao preservados.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setLaunchResetFeedback(null);

                const confirmed = window.confirm(
                  "Confirmar limpeza de lancamento? Isso apaga feed, ranking, palpites e usuarios nao-admin do banco atual."
                );

                if (!confirmed) {
                  return;
                }

                const response = await fetch("/api/admin/reset-launch", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ confirmation: "LIMPAR" })
                });
                const payload = await response.json();

                setLaunchResetFeedback(
                  response.ok
                    ? `Base limpa. Admins preservados: ${payload.keptAdmins?.join(", ") || "admin atual"}. Atualize a pagina.`
                    : payload.error ?? "Nao foi possivel limpar os dados."
                );
              })
            }
            className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-5 py-3 font-semibold text-rose-100 disabled:opacity-60"
          >
            {pending ? "Processando..." : "Limpar dados de teste"}
          </button>
          {launchResetFeedback ? (
            <p className="mt-4 text-sm text-brand-100">{launchResetFeedback}</p>
          ) : null}
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Aprovacoes</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Usuarios pendentes
          </h3>

          <div className="mt-4 space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-white/8 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-slate-300">{user.email}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      @{user.username ?? "sem_username"} · entrou {relativeTime(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <LoadingButton
                      type="button"
                      disabled={pending || approvalAction?.userId === user.id}
                      loading={
                        approvalAction?.userId === user.id &&
                        approvalAction.approvalStatus === "APPROVED"
                      }
                      loadingLabel="Aprovando..."
                      onClick={() => updateApproval(user.id, "APPROVED")}
                      className="rounded-2xl bg-brand-400 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Aprovar
                    </LoadingButton>
                    <LoadingButton
                      type="button"
                      disabled={pending || approvalAction?.userId === user.id}
                      loading={
                        approvalAction?.userId === user.id &&
                        approvalAction.approvalStatus === "REJECTED"
                      }
                      loadingLabel="Processando..."
                      onClick={() => updateApproval(user.id, "REJECTED")}
                      className="rounded-2xl border border-white/10 px-4 py-2 font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Recusar
                    </LoadingButton>
                  </div>
                </div>
              </div>
            ))}
            {!pendingUsers.length ? (
              <p className="text-sm text-slate-300">Nenhum usuario aguardando aprovacao.</p>
            ) : null}
          </div>
          {feedback ? <p className="mt-4 text-sm text-brand-100">{feedback}</p> : null}
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mata-mata</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Atualizar confrontos oficiais
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Busca na FIFA os times definidos para os jogos de mata-mata. Voce confere o
            preview e aplica somente os confrontos prontos; palpites, placares e ranking nao
            sao alterados.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={fetchKnockoutMatchups}
              className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-5 py-3 font-semibold text-sky-100 disabled:opacity-40"
            >
              {pending ? "Consultando..." : "Buscar confrontos na FIFA"}
            </button>
            <button
              type="button"
              disabled={pending || !knockoutMatchups?.summary.ready}
              onClick={applyKnockoutMatchups}
              className="rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 font-semibold text-emerald-100 disabled:opacity-40"
            >
              {pending ? "Aplicando..." : "Aplicar atualizacao confirmada"}
            </button>
          </div>

          {knockoutFeedback ? (
            <p className="mt-4 text-sm text-brand-100">{knockoutFeedback}</p>
          ) : null}

          {knockoutMatchups ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Prontos</p>
                  <p className="mt-2 text-2xl font-bold">{knockoutMatchups.summary.ready}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Atualizados</p>
                  <p className="mt-2 text-2xl font-bold">{knockoutMatchups.summary.unchanged}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Aguardando</p>
                  <p className="mt-2 text-2xl font-bold">{knockoutMatchups.summary.unavailable}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pendencias</p>
                  <p className="mt-2 text-2xl font-bold">{knockoutMatchups.summary.missingTeam}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Finalizados</p>
                  <p className="mt-2 text-2xl font-bold">{knockoutMatchups.summary.finished}</p>
                </div>
              </div>

              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {knockoutMatchups.matches.map((match) => (
                  <div
                    key={match.matchId}
                    className="rounded-2xl border border-white/8 bg-white/5 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Jogo {match.number} · {phaseLabels[match.phase]} ·{" "}
                          {formatLongDate(match.startsAt)}
                        </p>
                        <p className="mt-2 font-semibold text-slate-100">
                          Atual: {match.current.homeTeam} x {match.current.awayTeam}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          FIFA:{" "}
                          {match.official
                            ? `${match.official.homeTeam} x ${match.official.awayTeam}`
                            : "confronto ainda nao disponivel"}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${matchupStatusClasses[match.status]}`}
                      >
                        {matchupStatusLabels[match.status]}
                      </span>
                    </div>

                    {match.warnings.length ? (
                      <div className="mt-3 space-y-1 text-sm text-amber-100">
                        {match.warnings.map((warning) => (
                          <p key={warning}>{warning}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Simulador de resultado</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Conferir e finalizar resultado
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Simule primeiro para conferir a contagem. Depois, confirme o resultado oficial para
            finalizar o jogo e atualizar pontuacao e ranking.
          </p>

          <div className="mt-4 grid gap-3">
            <select
              value={simulationMatchId}
              onChange={(event) => {
                setSimulationMatchId(event.target.value);
                setManualSimulationMatchId(event.target.value);
                resetSimulationFields();
                setOfficialResult(null);
                invalidateSimulation();
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              {!data.simulationMatches.length ? (
                <option value="">Nenhum jogo aberto disponivel para simular</option>
              ) : null}
              {data.simulationMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  Jogo {match.number} · {match.homeTeam} x {match.awayTeam} ·{" "}
                  {formatLongDate(match.startsAt)}
                </option>
              ))}
            </select>

            {correctionMode && selectedSimulationMatch?.result ? (
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                <p className="font-semibold">Modo correcao auditada ativo</p>
                <p className="mt-1">
                  Resultado atual: {selectedSimulationMatch.result.score.home} x{" "}
                  {selectedSimulationMatch.result.score.away}. Ao aplicar, o sistema atualiza este
                  resultado, recalcula pontuacao/ranking e registra auditoria.
                </p>
              </div>
            ) : null}

            <button
              type="button"
              disabled={pending || !simulationMatchId}
              onClick={() =>
                startTransition(async () => {
                  setSimulationFeedback(null);
                  setSimulationPreview(null);
                  setOfficialResult(null);
                  resetSimulationFields();

                  try {
                    const response = await fetch("/api/admin/fetch-official-result", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        matchId: simulationMatchId
                      })
                    });
                    const payload = await response.json().catch(() => null);

                    if (!response.ok) {
                      setSimulationFeedback(
                        payload?.error ?? "Nao foi possivel consultar a FIFA."
                      );
                      return;
                    }

                    const result = payload.officialResult as AdminOfficialResultView;
                    setOfficialResult(result);
                    setSimulationHomeScore(result.score.home);
                    setSimulationAwayScore(result.score.away);
                    setSimulationScorers(result.scorers.join(", "));
                    setSimulationCardsEdge(result.cards.edge);
                    setSimulationCardsRange(result.cards.range);
                    setSimulationFeedback(
                      correctionMode
                        ? "Sumula oficial carregada. Confira os dados, simule a correcao e aplique para recalcular o ranking."
                        : "Sumula oficial carregada. Confira os dados e simule a pontuacao antes de aprovar."
                    );
                  } catch {
                    setSimulationFeedback(
                      "Nao foi possivel falar com a FIFA agora. Tente novamente."
                    );
                  }
                })
              }
              className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-5 py-3 font-semibold text-sky-100 disabled:opacity-40"
            >
              {pending ? "Consultando..." : "Buscar resultado na FIFA"}
            </button>

            {officialResult ? (
              <div className="rounded-2xl border border-sky-300/25 bg-sky-400/8 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-200">
                      Sumula oficial para aprovacao
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Fonte: {officialResult.source.name} · partida{" "}
                      {officialResult.source.matchId} · {officialResult.match.matchTime ?? "tempo final"}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sky-100">
                      {officialResult.scoringScope === "REGULATION_TIME"
                        ? "Pontuacao: somente tempo regulamentar + acrescimos"
                        : "Pontuacao: resultado oficial da partida"}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      officialResult.match.finished
                        ? "bg-emerald-400/15 text-emerald-100"
                        : "bg-amber-400/15 text-amber-100"
                    }`}
                  >
                    {officialResult.match.finished ? "Encerrada" : "Aguardando encerramento"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-slate-950/35 p-4">
                  <div>
                    <p className="font-semibold">{officialResult.match.homeTeam}</p>
                    <p className="text-xs text-slate-400">{officialResult.match.homeCode}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Para pontuacao
                    </p>
                    <p className="text-3xl font-bold">
                      {officialResult.score.home} x {officialResult.score.away}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{officialResult.match.awayTeam}</p>
                    <p className="text-xs text-slate-400">{officialResult.match.awayCode}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {officialResult.stages.map((stage) => (
                    <div
                      key={`${stage.label}-${stage.home}-${stage.away}`}
                      className={
                        stage.usedForScoring
                          ? "rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4"
                          : "rounded-2xl border border-white/8 bg-slate-950/35 p-4"
                      }
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {stage.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold">
                        {stage.home} x {stage.away}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {stage.usedForScoring
                          ? "Usado para simular e pontuar"
                          : "Informativo; nao entra no bolao"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Gols para pontuacao
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-slate-200">
                      {officialResult.goals.map((goal, index) => (
                        <p key={`${goal.player}-${goal.minute}-${index}`}>
                          {goal.minute ?? "-"} · {goal.player} ({goal.teamCode})
                        </p>
                      ))}
                      {!officialResult.goals.length ? <p>Sem gols.</p> : null}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Cartoes para pontuacao
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">
                      Amarelos: {officialResult.match.homeCode}{" "}
                      {officialResult.cards.homeYellow} x {officialResult.cards.awayYellow}{" "}
                      {officialResult.match.awayCode}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-slate-300">
                      {officialResult.cards.events.map((card, index) => (
                        <p key={`${card.player}-${card.minute}-${index}`}>
                          {card.minute ?? "-"} · {card.player} ({card.teamCode}) ·{" "}
                          {card.color === "YELLOW"
                            ? "amarelo"
                            : card.color === "RED"
                              ? "vermelho"
                              : "tipo a conferir"}
                        </p>
                      ))}
                      {!officialResult.cards.events.length ? <p>Sem cartoes registrados.</p> : null}
                    </div>
                  </div>
                </div>

                {officialResult.warnings.length ? (
                  <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">
                    {officialResult.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}

                <p className="mt-3 text-xs text-slate-400">
                  Os campos abaixo foram preenchidos com estes dados. Eles podem ser corrigidos
                  antes da simulacao; nenhuma pontuacao foi aplicada nesta etapa.
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={0}
                max={20}
                value={simulationHomeScore}
                placeholder="Gols time A"
                onChange={(event) => {
                  setSimulationHomeScore(
                    event.target.value === "" ? "" : Number(event.target.value)
                  );
                  invalidateSimulation();
                }}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              />
              <input
                type="number"
                min={0}
                max={20}
                value={simulationAwayScore}
                placeholder="Gols time B"
                onChange={(event) => {
                  setSimulationAwayScore(
                    event.target.value === "" ? "" : Number(event.target.value)
                  );
                  invalidateSimulation();
                }}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              />
            </div>

            <input
              value={simulationScorers}
              onChange={(event) => {
                setSimulationScorers(event.target.value);
                invalidateSimulation();
              }}
              placeholder="Artilheiros do resultado, separados por virgula"
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={simulationCardsEdge}
                onChange={(event) => {
                  setSimulationCardsEdge(event.target.value as CardsEdge);
                  invalidateSimulation();
                }}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <option value="" disabled>
                  Mais amarelos: carregue resultado
                </option>
                {cardsEdges.map((item) => (
                  <option key={item.value} value={item.value}>
                    Mais amarelos: {item.label}
                  </option>
                ))}
              </select>

              <select
                value={simulationCardsRange}
                onChange={(event) => {
                  setSimulationCardsRange(event.target.value as CardsRange);
                  invalidateSimulation();
                }}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <option value="" disabled>
                  Faixa de cartoes: carregue resultado
                </option>
                {cardsRanges.map((item) => (
                  <option key={item.value} value={item.value}>
                    Faixa de cartoes: {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={pending || !simulationMatchId || !simulationInputReady}
              onClick={() =>
                startTransition(async () => {
                  const simulationPayload = getSimulationPayload();

                  if (!simulationPayload) {
                    setSimulationFeedback(
                      "Carregue o resultado oficial antes de simular a pontuacao."
                    );
                    return;
                  }

                  setSimulationFeedback(null);
                  const response = await fetch("/api/admin/simulate-result", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(simulationPayload)
                  });

                  const payload = await response.json();

                  if (!response.ok) {
                    setSimulationPreview(null);
                    setSimulationFeedback(payload.error ?? "Nao foi possivel simular.");
                    return;
                  }

                  setSimulationPreview(payload.simulation);
                  setSimulationFeedback(
                    correctionMode
                      ? "Simulacao de correcao pronta. A aplicacao final recalcula o ranking completo."
                      : "Simulacao pronta. Pode usar para conferir a contagem."
                  );
                })
              }
              className="rounded-2xl bg-brand-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {pending
                ? "Simulando..."
                : correctionMode
                  ? "Simular correcao"
                  : "Simular pontuacao"}
            </button>

            <button
              type="button"
              disabled={pending || !simulationPreview || simulationPreview.match.id !== simulationMatchId}
              onClick={() => {
                const confirmed = window.confirm(
                  correctionMode
                    ? "Aplicar correcao auditada neste resultado? O placar oficial sera atualizado, os palpites serao reavaliados e o ranking sera recalculado."
                    : "Aprovar este resultado como oficial? A partida sera finalizada, os palpites serao pontuados e o ranking sera recalculado."
                );

                if (!confirmed) {
                  return;
                }

                startTransition(async () => {
                  const simulationPayload = getSimulationPayload();

                  if (!simulationPayload) {
                    setSimulationFeedback(
                      "Carregue e simule o resultado oficial antes de atualizar o ranking."
                    );
                    return;
                  }

                  setSimulationFeedback(null);
                  const response = await fetch("/api/admin/finalize-result", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(simulationPayload)
                  });
                  const payload = await response.json();

                  if (!response.ok) {
                    setSimulationFeedback(
                      payload.error ?? "Nao foi possivel finalizar o resultado."
                    );
                    return;
                  }

                  setSimulationPreview(null);
                  setOfficialResult(null);
                  setManualSimulationMatchId(null);
                  const aiPostMessage = payload.result.corrected
                    ? " Correcao auditada registrada; sem post automatico da IA."
                    : payload.aiPost?.postId
                    ? " IAestagiaria publicou a resenha do resultado."
                    : payload.aiPost?.reason === "ai_post_failed"
                      ? " Resultado ok; IAestagiaria nao conseguiu publicar agora."
                      : "";
                  setSimulationFeedback(
                    `Jogo ${payload.result.matchNumber} ${
                      payload.result.corrected ? "corrigido" : "finalizado"
                    }. ${payload.result.evaluatedPredictions} palpites avaliados e ranking atualizado.${aiPostMessage}`
                  );
                  router.refresh();
                });
              }}
              className="rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 font-semibold text-emerald-100 disabled:opacity-40"
            >
              {pending
                ? "Processando..."
                : correctionMode
                  ? "Aplicar correcao auditada"
                  : "Aprovar resultado e atualizar ranking"}
            </button>
          </div>

          {simulationFeedback ? <p className="mt-4 text-sm text-brand-100">{simulationFeedback}</p> : null}

          {simulationPreview ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Jogo {simulationPreview.match.number} · {phaseLabels[simulationPreview.match.phase]}
                </p>
                {simulationPreview.match.isCorrection ? (
                  <p className="mt-2 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">
                    Previa de correcao: os pontos deste jogo foram reprojetados. Ao aplicar, o
                    backend recalcula o ranking completo considerando tambem os impactos em
                    sequencias de acerto.
                  </p>
                ) : null}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Flag
                      countryCode={simulationPreview.match.homeCountryCode}
                      fallbackLabel={simulationPreview.match.homeCode}
                      alt={`Bandeira de ${simulationPreview.match.homeTeam}`}
                      size={36}
                    />
                    <div>
                      <p className="font-semibold">{simulationPreview.match.homeTeam}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        A · {simulationPreview.match.homeCode ?? "HOME"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Flag
                      countryCode={simulationPreview.match.awayCountryCode}
                      fallbackLabel={simulationPreview.match.awayCode}
                      alt={`Bandeira de ${simulationPreview.match.awayTeam}`}
                      size={36}
                    />
                    <div>
                      <p className="font-semibold">{simulationPreview.match.awayTeam}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        B · {simulationPreview.match.awayCode ?? "AWAY"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-950/35 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Palpites</p>
                    <p className="mt-2 text-2xl font-bold">{simulationPreview.summary.predictionsCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/35 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Media</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatPoints(simulationPreview.summary.averagePoints)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/35 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Acertos de vencedor</p>
                    <p className="mt-2 text-2xl font-bold">{simulationPreview.summary.winnerHits}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/35 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Placares cravados</p>
                    <p className="mt-2 text-2xl font-bold">{simulationPreview.summary.exactHits}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Top 5 projetado</p>
                <div className="mt-3 space-y-2">
                  {simulationPreview.projectedTopFive.map((row) => (
                    <div
                      key={row.userId}
                      className="flex items-center justify-between rounded-2xl bg-slate-950/35 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">
                          {formatRankPosition(row.projectedPosition)} {row.name}
                        </p>
                        <p className="text-sm text-slate-400">@{row.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPoints(row.projectedTotal)} pts</p>
                        <p className="text-sm text-brand-100">
                          {row.matchPoints > 0 ? `+${formatPoints(row.matchPoints)} no jogo` : "sem ganho"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quebra por usuario</p>
                <div className="mt-3 space-y-3">
                  {simulationPreview.results.map((row) => (
                    <div
                      key={row.userId}
                      className="rounded-2xl border border-white/8 bg-slate-950/35 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-sm text-slate-400">@{row.username}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xl font-bold text-brand-100">
                            +{formatPoints(row.matchPoints)} pts
                          </p>
                          <p className="text-sm text-slate-400">
                            {formatPoints(row.previousTotal)} → {formatPoints(row.projectedTotal)} no geral
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                        <p>Vencedor: {row.winnerHit ? "acertou" : "errou"}</p>
                        <p>Placar exato: {row.exactHit ? "sim" : "nao"}</p>
                        <p>Artilheiros: {row.scorerHits} acerto(s)</p>
                        <p>Cartoes: {formatPoints(row.cardsPoints)} pts</p>
                        <p>Bonus combo: {formatPoints(row.comboBonus)} pts</p>
                        <p>Bonus streak: {formatPoints(row.streakBonus)} pts</p>
                        <p>
                          Posicao: {row.currentPosition ?? "-"} → {row.projectedPosition ?? "-"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {!simulationPreview.results.length ? (
                    <p className="text-sm text-slate-300">
                      Esse jogo ainda nao tem palpites salvos para simular.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">IA do feed</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Gerar post da IAestagiaria
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            A IAestagiaria monta contexto real com ranking, subidas, quedas e jogos finalizados para publicar uma resenha pronta no feed.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={aiScope}
              onChange={(event) => setAiScope(event.target.value as LeaderboardScope)}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              <option value={LeaderboardScope.OVERALL}>Ranking geral</option>
              <option value={LeaderboardScope.GROUP_STAGE}>Fase de grupos</option>
              <option value={LeaderboardScope.KNOCKOUT}>Mata-mata</option>
            </select>

            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setAiFeedback(null);
                  const response = await fetch("/api/admin/ai-post", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ scope: aiScope })
                  });

                  const payload = await response.json();
                  if (!response.ok) {
                    setAiPreview(null);
                    setAiFeedback(payload.error ?? "Nao foi possivel gerar o post da IAestagiaria.");
                    return;
                  }

                  setAiPreview(payload.preview ?? null);
                  setAiFeedback(
                    `Post da IAestagiaria publicado no feed. Notificacoes criadas para ${payload.notifiedUsers ?? 0} usuarios; push enviado para ${payload.push?.sent ?? 0} dispositivo(s).`
                  );
                })
              }
              className="rounded-2xl bg-accent-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {pending ? "Gerando..." : "Gerar post da IAestagiaria"}
            </button>
          </div>

          {aiFeedback ? <p className="mt-4 text-sm text-brand-100">{aiFeedback}</p> : null}
          {aiPreview ? (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preview publicado</p>
              <p className="mt-2 text-sm leading-7 text-slate-100">{aiPreview}</p>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Saude da mesa</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Usuarios</p>
              <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold">
                {data.stats.users}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Palpites</p>
              <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold">
                {data.stats.predictions}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Aprovados</p>
              <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold">
                {data.stats.approvedUsers}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Posts</p>
              <p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-bold">
                {data.stats.posts}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Logs recentes</p>
          <div className="mt-4 space-y-3">
            {data.recentAudit.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="font-semibold">{log.action}</p>
                <p className="text-sm text-slate-300">
                  {log.entityType} · {log.entityId}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {relativeTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
