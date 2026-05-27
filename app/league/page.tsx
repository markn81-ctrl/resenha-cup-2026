import { ApprovalStatus, LeaderboardScope } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { leaderboardLabels } from "@/lib/constants";
import {
  getLeaderboardData,
  getPalpiteirosData,
  getUnreadNotificationsCount
} from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { LeaderboardTable } from "@/components/ranking/leaderboard-table";
import { PalpiteirosList } from "@/components/players/palpiteiros-list";
import { Panel } from "@/components/ui/panel";

export default async function LeaguePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [overall, groups, knockout, players, unreadNotifications] = await Promise.all([
    getLeaderboardData(LeaderboardScope.OVERALL),
    getLeaderboardData(LeaderboardScope.GROUP_STAGE),
    getLeaderboardData(LeaderboardScope.KNOCKOUT),
    getPalpiteirosData(),
    getUnreadNotificationsCount(session.user.id)
  ]);

  const secondaryRankings = [
    { key: LeaderboardScope.GROUP_STAGE, rows: groups },
    { key: LeaderboardScope.KNOCKOUT, rows: knockout }
  ];

  return (
    <AppShell
      title="Liga"
      subtitle="Ranking, palpiteiros e disputa interna em uma visao so."
      currentPath="/league"
      user={session.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ranking principal</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Classificacao geral
          </h2>
        </Panel>
        <LeaderboardTable rows={overall} highlightUserId={session.user.id} />

        <div className="grid gap-4 xl:grid-cols-2">
          {secondaryRankings.map((section) => (
            <section key={section.key} className="space-y-4">
              <Panel>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recorte</p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                  {leaderboardLabels[section.key]}
                </h2>
              </Panel>
              <LeaderboardTable rows={section.rows} highlightUserId={session.user.id} />
            </section>
          ))}
        </div>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Palpiteiros</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Quem esta na mesa
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Participantes aprovados, status, atividade e pontuacao ficam juntos para reduzir troca de abas.
          </p>
        </Panel>
        <PalpiteirosList players={players} currentUserId={session.user.id} />
      </div>
    </AppShell>
  );
}
