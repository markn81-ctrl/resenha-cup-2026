import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RivalryCard } from "@/components/dashboard/rivalry-card";
import { Panel } from "@/components/ui/panel";
import { MatchCard } from "@/components/matches/match-card";
import { FeedPostCard } from "@/components/feed/feed-post-card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [data, unreadNotifications] = await Promise.all([
    getDashboardData(session?.user?.id),
    getUnreadNotificationsCount(session?.user?.id)
  ]);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Seu pulso competitivo, a movimentacao do ranking e o clima da mesa."
      currentPath="/dashboard"
      user={session?.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <OverviewCards standing={data.currentStanding} rivalry={data.rivalry} topFive={data.topFive} />
        <RivalryCard rivalry={data.rivalry} />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Panel>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Proximos jogos</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                Janela quente de palpites
              </h2>
            </Panel>
            {data.upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          <div className="space-y-4">
            <Panel>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Feed em alta</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                A mesa ta falando
              </h2>
            </Panel>
            {data.hotFeed.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
