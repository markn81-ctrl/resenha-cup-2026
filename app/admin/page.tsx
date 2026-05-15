import { ApprovalStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminData, getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage() {
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

  const [data, unreadNotifications] = await Promise.all([
    getAdminData(),
    getUnreadNotificationsCount(session?.user?.id)
  ]);

  return (
    <AppShell
      title="Painel Admin"
      subtitle="Aprovacao de usuarios, metricas da liga e trilha de auditoria."
      currentPath="/admin"
      user={session?.user}
      unreadNotifications={unreadNotifications}
    >
      <AdminPanel data={data} />
    </AppShell>
  );
}
