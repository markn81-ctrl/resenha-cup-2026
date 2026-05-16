import { ApprovalStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { LaunchResetPanel } from "@/components/admin/launch-reset-panel";

export default async function LaunchResetPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const unreadNotifications = await getUnreadNotificationsCount(session.user.id);

  return (
    <AppShell
      title="Limpeza de Lancamento"
      subtitle="Remove dados fake do banco ativo e preserva sua conta admin."
      currentPath="/admin"
      user={session.user}
      unreadNotifications={unreadNotifications}
    >
      <LaunchResetPanel />
    </AppShell>
  );
}
