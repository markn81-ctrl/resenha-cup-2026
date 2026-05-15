"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Panel } from "@/components/ui/panel";

export function FeedComposer() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Panel>
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            setMessage(null);
            const response = await fetch("/api/feed", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                title: formData.get("title") || undefined,
                content: formData.get("content")
              })
            });

            const payload = await response.json();
            setMessage(response.ok ? "Post publicado. Atualize para ver no feed." : payload.error);
          });
        }}
        className="grid gap-3"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Solta a resenha</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Vale provocar, desde que siga amistoso.
          </h3>
        </div>
        <input
          name="title"
          placeholder="Titulo opcional"
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
        />
        <textarea
          name="content"
          required
          minLength={2}
          maxLength={500}
          rows={4}
          placeholder="Essa rodada vai mexer no top 5..."
          className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">Use humor, rivalidade e palpites quentes.</p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-brand-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {pending ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
      {message ? <p className="mt-3 text-sm text-brand-100">{message}</p> : null}
    </Panel>
  );
}
