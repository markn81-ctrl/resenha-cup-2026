"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { SmartNavLink } from "@/components/layout/smart-nav-link";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  currentPath: string;
  unreadNotifications: number;
};

async function markNotificationsAsRead() {
  try {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch {
    // The badge is visual feedback; a later page load will reconcile with the server.
  }
}

export function NotificationBell({
  currentPath,
  unreadNotifications
}: NotificationBellProps) {
  const [visibleUnread, setVisibleUnread] = useState(unreadNotifications);

  useEffect(() => {
    if (currentPath === "/resenha") {
      setVisibleUnread(0);
      void markNotificationsAsRead();
      return;
    }

    setVisibleUnread(unreadNotifications);
  }, [currentPath, unreadNotifications]);

  function handleOpenNotifications() {
    if (visibleUnread <= 0) {
      return;
    }

    setVisibleUnread(0);
    void markNotificationsAsRead();
  }

  return (
    <SmartNavLink
      href="/resenha"
      ariaLabel="Abrir resenha e alertas"
      onClick={handleOpenNotifications}
      className={cn(
        "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10",
        currentPath === "/resenha" && "border-brand-300/50 bg-brand-400/15 text-brand-100"
      )}
    >
      <Bell className="h-5 w-5" />
      {visibleUnread > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
          {visibleUnread > 9 ? "9+" : visibleUnread}
        </span>
      ) : null}
    </SmartNavLink>
  );
}
