import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMatchesData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { MatchCard } from "@/components/matches/match-card";
import { Panel } from "@/components/ui/panel";
import { SmartNavLink } from "@/components/layout/smart-nav-link";

export default async function MatchesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [matches, unreadNotifications] = await Promise.all([
    getMatchesData(session?.user?.id),
    getUnreadNotificationsCount(session?.user?.id)
  ]);

  return (
    <AppShell
      title="Jogos e Palpites"
      subtitle="104 partidas, lock automatico e um formulario pensado pra resposta rapida."
      currentPath="/matches"
      user={session?.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <Panel className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Regras rapidas</p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              Palpite trava 10 minutos antes do jogo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Vencedor vale +3, placar exato +6, artilheiro +3 cada, cartoes somam bonus e mata-mata aplica multiplicador.
            </p>
          </div>
          <SmartNavLink
            href="/rules"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Ver regra completa
          </SmartNavLink>
        </Panel>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </AppShell>
  );
}
