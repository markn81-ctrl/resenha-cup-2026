import Image from "next/image";
import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { Panel } from "@/components/ui/panel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnreadNotificationsCount } from "@/lib/queries";
import { getAvatarFallback, getDisplayName } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  const unreadNotifications = await getUnreadNotificationsCount(session.user.id);

  if (!user) {
    redirect("/");
  }

  const displayName = getDisplayName({
    name: user.name,
    email: user.email,
    username: user.username
  });

  return (
    <AppShell
      title="Perfil"
      subtitle="Edite seu nome, username, foto e bio para aparecer do seu jeito no jogo."
      currentPath="/profile"
      user={session.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Preview</p>
          <div className="mt-4 flex flex-col items-start gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={`Foto de perfil de ${displayName}`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-[28px] object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-brand-400 text-3xl font-bold text-slate-950">
                {getAvatarFallback(displayName)}
              </div>
            )}

            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold">
                {displayName}
              </h2>
              <p className="mt-1 text-sm uppercase tracking-[0.18em] text-slate-400">
                @{user.username ?? "sem_username"}
              </p>
              <p className="mt-2 text-sm text-slate-300">{user.email}</p>
              {user.bio ? <p className="mt-4 text-sm leading-7 text-slate-200">{user.bio}</p> : null}
            </div>
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Editar perfil</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Seu nome e sua foto no topo do app
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Sua conta continua participando do jogo normalmente. O acesso admin aparece so como permissao extra, sem te separar do resto da liga.
          </p>

          <div className="mt-6">
            <ProfileForm
              initialValues={{
                name: user.name ?? "",
                email: user.email ?? "",
                username: user.username ?? "",
                bio: user.bio ?? "",
                image: user.image ?? ""
              }}
            />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
