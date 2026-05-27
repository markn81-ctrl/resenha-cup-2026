import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { adminNavigation, playerNavigation } from "@/lib/constants";
import { cn, getAvatarFallback, getDisplayName } from "@/lib/utils";
import type { AppUserShell } from "@/types/app";

type AppShellProps = {
  title: string;
  subtitle: string;
  currentPath: string;
  user?: AppUserShell | null;
  unreadNotifications?: number;
  children: React.ReactNode;
};

export function AppShell({
  title,
  subtitle,
  currentPath,
  user,
  unreadNotifications = 0,
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
        <div className="glass flex flex-col gap-4 rounded-[24px] px-4 py-4 sm:rounded-[28px] sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
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

          <div className="min-w-0 flex-1 lg:px-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-brand-200 sm:text-xs sm:tracking-[0.28em]">Resenha Cup 2026</p>
            <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">{subtitle}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              Bem-vindo a Resenha Cup 2026. Qual o palpite de hoje?
            </p>
          </div>

          <div className="flex items-center justify-start gap-3 sm:justify-end">
            <Link
              href="/notifications"
              prefetch={false}
              aria-label="Abrir alertas"
              className={cn(
                "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10",
                currentPath === "/notifications" && "border-brand-300/50 bg-brand-400/15 text-brand-100"
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              ) : null}
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <nav className="glass flex flex-nowrap items-center gap-2 overflow-x-auto rounded-[22px] p-2 [scrollbar-width:none] sm:rounded-[24px] sm:p-3 [&::-webkit-scrollbar]:hidden">
            <span className="hidden px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:inline">
              Jogo
            </span>
            {playerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "whitespace-nowrap rounded-2xl px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:py-3 sm:text-sm",
                  currentPath === item.href &&
                    "bg-brand-400 text-slate-950 shadow-lg shadow-brand-400/30"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {user?.role === Role.ADMIN ? (
            <nav className="glass flex flex-nowrap items-center gap-2 overflow-x-auto rounded-[22px] p-2 [scrollbar-width:none] sm:rounded-[24px] sm:p-3 [&::-webkit-scrollbar]:hidden">
              <span className="hidden px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 sm:inline">
                Administracao
              </span>
              {adminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "whitespace-nowrap rounded-2xl px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4 sm:py-3 sm:text-sm",
                    currentPath === item.href && "bg-accent-300 text-slate-950"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
