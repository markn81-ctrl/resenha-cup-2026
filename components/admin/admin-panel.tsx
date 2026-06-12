"use client";

import { CardsEdge, CardsRange, LeaderboardScope } from "@prisma/client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminSimulationView, AdminView } from "@/types/app";
import { Panel } from "@/components/ui/panel";
import { Flag } from "@/components/ui/flag";
import { LoadingButton } from "@/components/ui/loading-button";
import { phaseLabels, playerPositionShortLabels } from "@/lib/constants";
import { formatLongDate, formatPoints, relativeTime } from "@/lib/utils";

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

export function AdminPanel({ data }: { data: AdminView }) {
  const router = useRouter();
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
  const [teamEditorFeedback, setTeamEditorFeedback] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(data.playerTeams[0]?.teamId ?? "");
  const [teamRosters, setTeamRosters] = useState(data.playerTeams);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [simulationMatchId, setSimulationMatchId] = useState<string>(
    data.simulationMatches[0]?.id ?? ""
  );
  const [simulationHomeScore, setSimulationHomeScore] = useState(1);
  const [simulationAwayScore, setSimulationAwayScore] = useState(0);
  const [simulationCardsEdge, setSimulationCardsEdge] = useState<CardsEdge>(CardsEdge.EQUAL);
  const [simulationCardsRange, setSimulationCardsRange] = useState<CardsRange>(
    CardsRange.THREE_FOUR
  );
  const [simulationScorers, setSimulationScorers] = useState("");
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);
  const [simulationPreview, setSimulationPreview] = useState<AdminSimulationView | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedTeam = teamRosters.find((team) => team.teamId === selectedTeamId) ?? teamRosters[0] ?? null;

  useEffect(() => {
    setPendingUsers(data.pendingUsers);
  }, [data.pendingUsers]);

  useEffect(() => {
    setTeamRosters(data.playerTeams);
  }, [data.playerTeams]);

  useEffect(() => {
    if (!selectedTeamId && data.playerTeams[0]?.teamId) {
      setSelectedTeamId(data.playerTeams[0].teamId);
    }
  }, [data.playerTeams, selectedTeamId]);

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
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Elencos</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Editar nomes dos jogadores
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Os slots e as posicoes ja estao pre-alocados. Aqui voce so ajusta os nomes reais de cada selecao, e o formulario de palpites passa a listar esses jogadores.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedTeamId}
              onChange={(event) => {
                setSelectedTeamId(event.target.value);
                setTeamEditorFeedback(null);
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              {!teamRosters.length ? <option value="">Nenhuma selecao cadastrada</option> : null}
              {teamRosters.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.name} · {team.code}
                </option>
              ))}
            </select>

            {selectedTeam ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <Flag
                  countryCode={selectedTeam.countryCode}
                  fallbackLabel={selectedTeam.code}
                  alt={`Bandeira de ${selectedTeam.name}`}
                  size={32}
                />
                <div>
                  <p className="font-semibold">{selectedTeam.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {selectedTeam.code} · {selectedTeam.players.length} slots
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {teamEditorFeedback ? <p className="mt-4 text-sm text-brand-100">{teamEditorFeedback}</p> : null}

          {selectedTeam ? (
            <div className="mt-4 max-h-[38rem] space-y-3 overflow-y-auto pr-1">
              {selectedTeam.players.map((player) => {
                const draftName = editingNames[player.id] ?? player.name;

                return (
                  <div
                    key={player.id}
                    className="grid gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 lg:grid-cols-[auto_1fr_auto]"
                  >
                    <div className="min-w-[84px]">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Slot {String(player.slotNumber).padStart(2, "0")}
                      </p>
                      <p className="mt-1 font-semibold">
                        {playerPositionShortLabels[player.position]}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <input
                        value={draftName}
                        onChange={(event) =>
                          setEditingNames((current) => ({
                            ...current,
                            [player.id]: event.target.value
                          }))
                        }
                        placeholder="Nome oficial do jogador"
                        className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                      />
                      <p className="text-xs text-slate-500">
                        Nome curto atual: {player.shortName ?? "sem apelido"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={pending || savingPlayerId === player.id || !draftName.trim()}
                      onClick={() =>
                        startTransition(async () => {
                          setTeamEditorFeedback(null);
                          setSavingPlayerId(player.id);

                          const response = await fetch("/api/admin/players", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                              playerId: player.id,
                              name: draftName
                            })
                          });

                          const payload = await response.json();
                          setSavingPlayerId(null);

                          if (!response.ok) {
                            setTeamEditorFeedback(payload.error ?? "Nao foi possivel salvar o jogador.");
                            return;
                          }

                          setTeamRosters((current) =>
                            current.map((team) =>
                              team.teamId === selectedTeam.teamId
                                ? {
                                    ...team,
                                    players: team.players.map((item) =>
                                      item.id === player.id
                                        ? {
                                            ...item,
                                            name: payload.player.name,
                                            shortName: payload.player.shortName
                                          }
                                        : item
                                    )
                                  }
                                : team
                            )
                          );

                          setEditingNames((current) => ({
                            ...current,
                            [player.id]: payload.player.name
                          }));
                          setTeamEditorFeedback(`Jogador salvo em ${selectedTeam.name}.`);
                        })
                      }
                      className="rounded-2xl bg-brand-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {savingPlayerId === player.id ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                );
              })}
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
              onChange={(event) => setSimulationMatchId(event.target.value)}
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

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={0}
                max={20}
                value={simulationHomeScore}
                onChange={(event) => setSimulationHomeScore(Number(event.target.value))}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              />
              <input
                type="number"
                min={0}
                max={20}
                value={simulationAwayScore}
                onChange={(event) => setSimulationAwayScore(Number(event.target.value))}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              />
            </div>

            <input
              value={simulationScorers}
              onChange={(event) => setSimulationScorers(event.target.value)}
              placeholder="Artilheiros do resultado, separados por virgula"
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={simulationCardsEdge}
                onChange={(event) => setSimulationCardsEdge(event.target.value as CardsEdge)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                {cardsEdges.map((item) => (
                  <option key={item.value} value={item.value}>
                    Mais amarelos: {item.label}
                  </option>
                ))}
              </select>

              <select
                value={simulationCardsRange}
                onChange={(event) => setSimulationCardsRange(event.target.value as CardsRange)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                {cardsRanges.map((item) => (
                  <option key={item.value} value={item.value}>
                    Faixa de cartoes: {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={pending || !simulationMatchId}
              onClick={() =>
                startTransition(async () => {
                  setSimulationFeedback(null);
                  const response = await fetch("/api/admin/simulate-result", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
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
                    })
                  });

                  const payload = await response.json();

                  if (!response.ok) {
                    setSimulationPreview(null);
                    setSimulationFeedback(payload.error ?? "Nao foi possivel simular.");
                    return;
                  }

                  setSimulationPreview(payload.simulation);
                  setSimulationFeedback("Simulacao pronta. Pode usar para conferir a contagem.");
                })
              }
              className="rounded-2xl bg-brand-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {pending ? "Simulando..." : "Simular resultado"}
            </button>

            <button
              type="button"
              disabled={pending || !simulationPreview || simulationPreview.match.id !== simulationMatchId}
              onClick={() => {
                const confirmed = window.confirm(
                  "Confirmar este resultado como oficial? O jogo sera finalizado e o ranking sera recalculado."
                );

                if (!confirmed) {
                  return;
                }

                startTransition(async () => {
                  setSimulationFeedback(null);
                  const response = await fetch("/api/admin/finalize-result", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
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
                    })
                  });
                  const payload = await response.json();

                  if (!response.ok) {
                    setSimulationFeedback(
                      payload.error ?? "Nao foi possivel finalizar o resultado."
                    );
                    return;
                  }

                  setSimulationPreview(null);
                  setSimulationFeedback(
                    `Jogo ${payload.result.matchNumber} finalizado. ${payload.result.evaluatedPredictions} palpites avaliados e ranking atualizado.`
                  );
                  router.refresh();
                });
              }}
              className="rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 font-semibold text-emerald-100 disabled:opacity-40"
            >
              {pending ? "Processando..." : "Confirmar resultado oficial"}
            </button>
          </div>

          {simulationFeedback ? <p className="mt-4 text-sm text-brand-100">{simulationFeedback}</p> : null}

          {simulationPreview ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Jogo {simulationPreview.match.number} · {phaseLabels[simulationPreview.match.phase]}
                </p>
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
                          #{row.projectedPosition} {row.name}
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
