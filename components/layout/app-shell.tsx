import Image from "next/image";
import { Minus, TrendingDown, TrendingUp, UserCircle } from "lucide-react";
import { Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SmartNavLink } from "@/components/layout/smart-nav-link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PushOptIn } from "@/components/notifications/push-opt-in";
import { adminNavigation, playerNavigation } from "@/lib/constants";
import { cn, formatPoints, getAvatarFallback, getDisplayName } from "@/lib/utils";
import type { AppUserShell } from "@/types/app";

type AppShellProps = {
  title: string;
  subtitle: string;
  currentPath: string;
  user?: AppUserShell | null;
  unreadNotifications?: number;
  standing?: {
    position: number;
    totalPoints: number;
    movement: number;
    pointsToNext: number | null;
  };
  children: React.ReactNode;
};

export function AppShell({
  title,
  subtitle,
  currentPath,
  user,
  unreadNotifications = 0,
  standing,
  children
}: AppShellProps) {
  const displayName = getDisplayName({
    name: user?.name,
    email: user?.email,
    username: user?.username
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-3 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
        <div className="glass flex flex-col gap-4 rounded-[24px] px-4 py-4 sm:rounded-[28px] sm:px-5 sm:py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="shrink-0">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={`Foto de perfil de ${displayName}`}
                  width={56}
                  height={56}
                  className="h-12 w-12 rounded-[18px] object-cover ring-1 ring-white/10 sm:h-14 sm:w-14 sm:rounded-[20px]"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-400 text-sm font-bold text-slate-950 sm:h-14 sm:w-14 sm:rounded-[20px] sm:text-base">
                  {getAvatarFallback(displayName)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="max-w-[150px] truncate text-sm font-semibold sm:max-w-none sm:text-base">{displayName}</p>
                <span className="rounded-full bg-brand-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-100">
                  Bem-vindo
                </span>
                {user?.role === Role.ADMIN ? (
                  <span className="rounded-full border border-accent-300/40 bg-accent-300/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-100">
                    Acesso admin
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs uppercase tracking-[0.2em] text-slate-400">
                Participante · @{user?.username ?? "guest"}
              </p>
              {user?.email ? (
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1 xl:px-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-brand-200 sm:text-xs sm:tracking-[0.28em]">Resenha Cup 2026</p>
            <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">{subtitle}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              Bem-vindo a Resenha Cup 2026. Qual o palpite de hoje?
            </p>
          </div>

          {standing ? (
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[290px]">
              <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Posicao Mata-Mata
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-[family-name:var(--font-heading)] text-3xl font-bold">
                    #{standing.position || "-"}
                  </p>
                  <span className="flex items-center gap-1 text-xs text-slate-300">
                    {standing.movement > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                    ) : standing.movement < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-rose-300" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                    {standing.movement > 0
                      ? `+${standing.movement}`
                      : standing.movement < 0
                        ? standing.movement
                        : "Estavel"}
                  </span>
                </div>
              </div>
              <div className="rounded-[18px] border border-brand-300/20 bg-brand-400/10 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-brand-100">
                    Pontuacao Mata-Mata
                  </p>
                  <span className="w-fit rounded-full bg-accent-300/15 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-accent-100">
                    Vale o pote
                  </span>
                </div>
                <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold">
                  {formatPoints(standing.totalPoints)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  {standing.position === 0
                    ? "Aguardando ranking"
                    : standing.pointsToNext
                      ? `${formatPoints(standing.pointsToNext)} pts para subir`
                      : "Na ponta da tabela"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-start gap-3 sm:justify-end">
            <PushOptIn />
            <NotificationBell
              currentPath={currentPath}
              unreadNotifications={unreadNotifications}
            />
            <SmartNavLink
              href="/profile"
              ariaLabel="Abrir perfil"
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10",
                currentPath === "/profile" && "border-brand-300/50 bg-brand-400/15 text-brand-100"
              )}
            >
              <UserCircle className="h-5 w-5" />
            </SmartNavLink>
            <SignOutButton />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <nav className="glass flex flex-nowrap items-center gap-2 overflow-x-auto rounded-[22px] p-2 [scrollbar-width:none] sm:rounded-[24px] sm:p-3 [&::-webkit-scrollbar]:hidden">
            <span className="hidden px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:inline">
              Jogo
            </span>
            {playerNavigation.map((item) => (
              <SmartNavLink
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-2xl px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:py-3 sm:text-sm",
                  currentPath === item.href &&
                    "bg-brand-400 text-slate-950 shadow-lg shadow-brand-400/30"
                )}
              >
                {item.label}
              </SmartNavLink>
            ))}
          </nav>

          {user?.role === Role.ADMIN ? (
            <nav className="glass flex flex-nowrap items-center gap-2 overflow-x-auto rounded-[22px] p-2 [scrollbar-width:none] sm:rounded-[24px] sm:p-3 [&::-webkit-scrollbar]:hidden">
              <span className="hidden px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:inline">
                Administracao
              </span>
              {adminNavigation.map((item) => (
                <SmartNavLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-2xl px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:py-3 sm:text-sm",
                    currentPath === item.href && "bg-accent-300 text-slate-950"
                  )}
                >
                  {item.label}
                </SmartNavLink>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
