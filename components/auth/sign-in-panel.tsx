"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";

type ProviderButton = {
  id: string;
  name: string;
};

export function SignInPanel() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<ProviderButton[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    void getProviders().then((providers) => {
      if (!active || !providers) {
        return;
      }

      const availableProviders = Object.values(providers)
        .filter((provider) => provider.type === "oauth")
        .map((provider) => ({
          id: provider.id,
          name: provider.name
        }));

      setOauthProviders(availableProviders);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleCredentials(formData: FormData) {
    setMessage(null);

    if (isRegister) {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.get("name"),
          username: formData.get("username"),
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel criar sua conta.");
        return;
      }

      setMessage("Conta criada. Agora e so entrar e aguardar a aprovacao do admin.");
      setIsRegister(false);
      return;
    }

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
      callbackUrl: "/dashboard"
    });

    if (result?.error) {
      setMessage("Credenciais invalidas.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="glass rounded-[32px] p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-200">Entrada da resenha</p>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
          Entre no jogo antes que a tabela dispare.
        </h2>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          Login com Google, Apple ou email. Toda conta nova entra como pendente ate a aprovacao do admin.
        </p>
      </div>

      {oauthProviders.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {oauthProviders.map((provider) => (
            <Link
              key={provider.id}
              href={`/api/auth/signin/${provider.id}?callbackUrl=/dashboard`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Entrar com {provider.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
        <div className="h-px flex-1 bg-white/10" />
        {oauthProviders.length ? "ou email" : "acesso por email"}
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => {
            void handleCredentials(formData);
          });
        }}
        className="grid gap-3"
      >
        {isRegister ? (
          <>
            <input
              name="name"
              placeholder="Seu nome"
              required
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 placeholder:text-slate-500"
            />
            <input
              name="username"
              placeholder="username"
              required
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 placeholder:text-slate-500"
            />
          </>
        ) : null}

        <input
          name="email"
          type="email"
          placeholder="voce@email.com"
          required
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 placeholder:text-slate-500"
        />
        <input
          name="password"
          type="password"
          placeholder="********"
          required
          minLength={8}
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 outline-none ring-0 placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-brand-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-brand-300 disabled:opacity-60"
        >
          {pending ? "Carregando..." : isRegister ? "Criar conta" : "Entrar com email"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-brand-100">{message}</p> : null}

      <button
        type="button"
        onClick={() => setIsRegister((value) => !value)}
        className="mt-4 text-sm text-slate-300 underline underline-offset-4"
      >
        {isRegister ? "Ja tenho conta" : "Quero criar conta com email"}
      </button>
    </div>
  );
}
