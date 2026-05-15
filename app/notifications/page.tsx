import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNotificationsData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const [notifications, unreadNotifications] = await Promise.all([
    getNotificationsData(session?.user?.id),
    getUnreadNotificationsCount(session?.user?.id)
  ]);

  return (
    <AppShell
      title="Notificacoes"
      subtitle="Mudancas de ranking, lembretes de lock e interacoes no feed."
      currentPath="/notifications"
      user={session?.user}
      unreadNotifications={unreadNotifications}
    >
      <NotificationList items={notifications} />
    </AppShell>
  );
}
