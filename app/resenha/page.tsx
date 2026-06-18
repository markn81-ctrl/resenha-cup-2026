import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getFeedData,
  getNotificationsData
} from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { NotificationList } from "@/components/notifications/notification-list";
import { Panel } from "@/components/ui/panel";

export default async function ResenhaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [posts, notifications] = await Promise.all([
    getFeedData(session.user.id),
    getNotificationsData(session.user.id)
  ]);
  const viewedNotifications = notifications.map((item) => ({
    ...item,
    isRead: true
  }));

  return (
    <AppShell
      title="Resenha"
      subtitle="Feed, IAestagiaria, comentarios e alertas em um unico fluxo."
      currentPath="/resenha"
      user={session.user}
      unreadNotifications={0}
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <FeedComposer />
          {!posts.length ? (
            <Panel>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Feed zerado</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
                A resenha ainda vai comecar
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Sem posts fake por aqui. Quando a turma comentar ou a IAestagiaria provocar, tudo aparece neste fluxo.
              </p>
            </Panel>
          ) : null}
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </section>

        <aside className="space-y-4">
          <Panel>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Alertas</p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              O que pede atencao
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Notificacoes importantes ficam ao lado da conversa para voce nao precisar trocar de pagina.
            </p>
          </Panel>
          <NotificationList items={viewedNotifications} />
        </aside>
      </div>
    </AppShell>
  );
}
