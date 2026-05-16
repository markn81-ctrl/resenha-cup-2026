import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPalpiteirosData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { PalpiteirosList } from "@/components/players/palpiteiros-list";

export default async function PlayersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [players, unreadNotifications] = await Promise.all([
    getPalpiteirosData(),
    getUnreadNotificationsCount(session.user.id)
  ]);

  return (
    <AppShell
      title="Palpiteiros"
      subtitle="A galera aprovada na liga, com status, atividade e clima de resenha."
      currentPath="/players"
      user={session.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Participantes</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Quem ja esta na mesa
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Conforme voce aprovar os convites no admin, os novos palpiteiros aparecem aqui automaticamente.
          </p>
        </Panel>

        <PalpiteirosList players={players} currentUserId={session.user.id} />
      </div>
    </AppShell>
  );
}
