import { ApprovalStatus, LeaderboardScope } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getLeaderboardData,
  getPalpiteirosData,
  getUnreadNotificationsCount
} from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { LeaderboardSwitcher } from "@/components/ranking/leaderboard-switcher";
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

  const [overall, knockout, players, unreadNotifications] = await Promise.all([
    getLeaderboardData(LeaderboardScope.OVERALL),
    getLeaderboardData(LeaderboardScope.KNOCKOUT),
    getPalpiteirosData(),
    getUnreadNotificationsCount(session.user.id)
  ]);

  return (
    <AppShell
      title="Ranking"
      subtitle="Classificacao, palpiteiros e disputa interna em uma visao so."
      currentPath="/league"
      user={session.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <LeaderboardSwitcher
          overall={overall}
          knockout={knockout}
          highlightUserId={session.user.id}
        />

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
