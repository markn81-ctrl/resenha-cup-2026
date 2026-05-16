import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFeedData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { Panel } from "@/components/ui/panel";

export default async function FeedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [posts, unreadNotifications] = await Promise.all([
    getFeedData(session?.user?.id),
    getUnreadNotificationsCount(session?.user?.id)
  ]);

  return (
    <AppShell
      title="Feed Social"
      subtitle="Comentarios da IA, provocacoes dos amigos e eventos do sistema no mesmo fluxo."
      currentPath="/feed"
      user={session?.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <FeedComposer />
        {!posts.length ? (
          <Panel>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Feed zerado</p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              A resenha ainda vai comecar
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Sem posts fake por aqui. Quando os convidados entrarem, comentarem ou a IAestagiaria tiver motivo para provocar, tudo aparece neste feed.
            </p>
          </Panel>
        ) : null}
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </AppShell>
  );
}
