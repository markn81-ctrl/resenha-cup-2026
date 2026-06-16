import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMatchesData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { MatchCard } from "@/components/matches/match-card";
import { Panel } from "@/components/ui/panel";
import { SmartNavLink } from "@/components/layout/smart-nav-link";

type MatchesTab = "open" | "locked" | "finished";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MatchesPage({
  searchParams
}: {
  searchParams?: { tab?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const selectedTab: MatchesTab =
    searchParams?.tab === "finished"
      ? "finished"
      : searchParams?.tab === "locked"
        ? "locked"
        : "open";

  const [matches, unreadNotifications] = await Promise.all([
    getMatchesData(session?.user?.id, selectedTab),
    getUnreadNotificationsCount(session?.user?.id)
  ]);
  const tabs: Array<{ key: MatchesTab; label: string; href: string }> = [
    { key: "open", label: "Abertos", href: "/matches" },
    { key: "locked", label: "Travados", href: "/matches?tab=locked" },
    { key: "finished", label: "Finalizados", href: "/matches?tab=finished" }
  ];

  return (
    <AppShell
      title="Jogos e Palpites"
      subtitle="104 partidas, palpites abertos ate 10 minutos antes da bola rolar."
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

        <div className="flex flex-wrap gap-2 rounded-3xl border border-white/8 bg-white/5 p-2">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.key;

            return (
              <SmartNavLink
                key={tab.key}
                href={tab.href}
                prefetchOnIntent={false}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/8 hover:text-slate-100"
                }`}
              >
                {tab.label}
              </SmartNavLink>
            );
          })}
        </div>

        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        {!matches.length ? (
          <Panel>
            <p className="text-sm text-slate-300">
              {selectedTab === "finished"
                ? "Ainda nao ha jogos finalizados para consultar."
                : selectedTab === "locked"
                  ? "Nenhum jogo travado aguardando resultado agora."
                  : "Nenhum jogo aberto para palpite agora."}
            </p>
          </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}
