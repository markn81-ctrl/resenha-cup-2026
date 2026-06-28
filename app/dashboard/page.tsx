import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { TopTenPreview } from "@/components/dashboard/top-ten-preview";
import { RivalryCard } from "@/components/dashboard/rivalry-card";
import { SmartNavLink } from "@/components/layout/smart-nav-link";
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
      title="Inicio"
      subtitle="O que vale agora: Ranking Mata-Mata, proximo palpite, rivalidade e resenha em movimento."
      currentPath="/dashboard"
      user={session?.user}
      unreadNotifications={unreadNotifications}
      standing={data.currentStanding}
    >
      <div className="space-y-4">
        <TopTenPreview rows={data.topTen} currentUserId={session.user.id} />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Proximo foco</p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                  Palpite da vez
                </h2>
              </div>
              <SmartNavLink
                href="/matches"
                className="rounded-2xl bg-brand-400 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-brand-300"
              >
                Ver todos os palpites
              </SmartNavLink>
            </Panel>
            {data.upcomingMatches.slice(0, 1).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {data.upcomingMatches.slice(1, 4).length ? (
              <Panel>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Na sequencia</p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                  Proximos palpites
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Os proximos jogos tambem ficam prontos para criar ou editar palpite sem sair do Inicio.
                </p>
              </Panel>
            ) : null}
            {data.upcomingMatches.slice(1, 4).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {!data.upcomingMatches.length ? (
              <Panel>
                <p className="text-sm text-slate-300">
                  Nenhum jogo carregado para exibir agora. Quando a tabela estiver ativa, os cards de palpite aparecem aqui.
                </p>
              </Panel>
            ) : null}
          </div>

          <div className="space-y-4">
            <RivalryCard rivalry={data.rivalry} />
            <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Resenha</p>
                <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                  A mesa ta falando
                </h2>
              </div>
              <SmartNavLink
                href="/resenha"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Abrir resenha
              </SmartNavLink>
            </Panel>
            {data.hotFeed.slice(0, 1).map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
            {!data.hotFeed.length ? (
              <Panel>
                <p className="text-sm text-slate-300">
                  Feed limpo para o lancamento. A IAestagiaria ainda esta so observando a bagunca se formar.
                </p>
              </Panel>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
