import { ApprovalStatus, LeaderboardScope } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { leaderboardLabels } from "@/lib/constants";
import { getLeaderboardData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { LeaderboardTable } from "@/components/ranking/leaderboard-table";
import { Panel } from "@/components/ui/panel";

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [overall, groups, knockout, unreadNotifications] = await Promise.all([
    getLeaderboardData(LeaderboardScope.OVERALL),
    getLeaderboardData(LeaderboardScope.GROUP_STAGE),
    getLeaderboardData(LeaderboardScope.KNOCKOUT),
    getUnreadNotificationsCount(session?.user?.id)
  ]);

  const sections = [
    { key: LeaderboardScope.OVERALL, rows: overall },
    { key: LeaderboardScope.GROUP_STAGE, rows: groups },
    { key: LeaderboardScope.KNOCKOUT, rows: knockout }
  ];

  return (
    <AppShell
      title="Ranking"
      subtitle="Geral, grupos e mata-mata em visoes separadas para esquentar cada fase."
      currentPath="/leaderboard"
      user={session?.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.key} className="space-y-4">
            <Panel>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Scope</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                {leaderboardLabels[section.key]}
              </h2>
            </Panel>
            <LeaderboardTable rows={section.rows} highlightUserId={session?.user?.id} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
