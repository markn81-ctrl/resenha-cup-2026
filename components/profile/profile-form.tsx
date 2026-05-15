"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  initialValues: {
    name: string;
    email: string;
    username: string;
    bio: string;
    image: string;
  };
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setMessage(null);
          const response = await fetch("/api/profile", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: formData.get("name"),
              username: formData.get("username"),
              bio: formData.get("bio"),
              image: formData.get("image")
            })
          });

          const payload = await response.json();
          if (!response.ok) {
            setMessage(payload.error ?? "Nao foi possivel atualizar o perfil.");
            return;
          }

          setMessage("Perfil atualizado com sucesso.");
          router.refresh();
        });
      }}
      className="grid gap-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-200">
            Nome exibido
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initialValues.name}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="username" className="text-sm font-medium text-slate-200">
            Username
          </label>
          <input
            id="username"
            name="username"
            defaultValue={initialValues.username}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="email"
          value={initialValues.email}
          disabled
          className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-slate-400"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="image" className="text-sm font-medium text-slate-200">
          URL da foto
        </label>
        <input
          id="image"
          name="image"
          defaultValue={initialValues.image}
          placeholder="https://..."
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
        />
        <p className="text-xs text-slate-400">
          Pode usar a foto do Google ou colar a URL de uma imagem publica.
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="bio" className="text-sm font-medium text-slate-200">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={initialValues.bio}
          placeholder="Dono da resenha, cravador de placar, especialista em zicar..."
          className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          O topo do app e o feed usam essas informacoes para identificar voce.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-brand-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>

      {message ? <p className="text-sm text-brand-100">{message}</p> : null}
    </form>
  );
}
