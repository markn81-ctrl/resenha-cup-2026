import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFeedData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedPostCard } from "@/components/feed/feed-post-card";

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
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </AppShell>
  );
}
