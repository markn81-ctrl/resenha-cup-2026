"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white sm:px-4"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
