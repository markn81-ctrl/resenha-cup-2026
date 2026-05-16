"use client";

import { useState, useTransition } from "react";
import { Panel } from "@/components/ui/panel";

export function LaunchResetPanel() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Panel>
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lancamento</p>
      <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
        Limpar dados de teste
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
        Esta acao roda no banco ativo da aplicacao em producao. Ela remove ranking, feed, notificacoes,
        palpites, resultados simulados e usuarios nao-admin. Sua conta admin e outros admins sao preservados.
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFeedback(null);

            const confirmed = window.confirm(
              "Confirmar limpeza de lancamento? Isso apaga feed, ranking, palpites e usuarios nao-admin do banco atual."
            );

            if (!confirmed) {
              return;
            }

            const response = await fetch("/api/admin/reset-launch", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ confirmation: "LIMPAR" })
            });
            const payload = await response.json();

            setFeedback(
              response.ok
                ? `Base limpa. Admins preservados: ${payload.keptAdmins?.join(", ") || "admin atual"}.`
                : payload.error ?? "Nao foi possivel limpar os dados."
            );
          })
        }
        className="mt-6 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-5 py-3 font-semibold text-rose-100 disabled:opacity-60"
      >
        {pending ? "Processando..." : "Limpar dados de teste"}
      </button>

      {feedback ? <p className="mt-4 text-sm text-brand-100">{feedback}</p> : null}
    </Panel>
  );
}
