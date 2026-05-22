"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from "@/lib/legal";

export function SignInPanel() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [oauthPendingProvider, setOauthPendingProvider] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleCredentials(formData: FormData) {
    setMessage(null);

    if (isRegister) {
      if (!legalAccepted) {
        setMessage("Voce precisa aceitar os termos e a politica de privacidade para criar conta.");
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.get("name"),
          username: formData.get("username"),
          email: formData.get("email"),
          password: formData.get("password"),
          acceptTerms: legalAccepted
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

  async function handleOAuthSignIn(providerId: string) {
    setMessage(null);

    if (!legalAccepted) {
      setMessage("Aceite os termos e a politica de privacidade antes de continuar com provedor externo.");
      return;
    }

    setOauthPendingProvider(providerId);

    try {
      await signIn(providerId, {
        callbackUrl: "/dashboard",
        redirect: true
      });
    } catch {
      setMessage("Nao foi possivel iniciar o login com Google. Tente novamente.");
      setOauthPendingProvider(null);
    }
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

      <label className="mb-4 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
        <input
          type="checkbox"
          checked={legalAccepted}
          onChange={(event) => setLegalAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950"
        />
        <span>
          Li e aceito os{" "}
          <a className="font-semibold text-brand-100 underline underline-offset-4" href="/terms">
            Termos de Uso
          </a>{" "}
          v{LEGAL_TERMS_VERSION} e a{" "}
          <a className="font-semibold text-brand-100 underline underline-offset-4" href="/privacy">
            Politica de Privacidade
          </a>{" "}
          v{LEGAL_PRIVACY_VERSION}.
        </span>
      </label>

      <div className="grid gap-3">
        <button
          type="button"
          disabled={Boolean(oauthPendingProvider) || !legalAccepted}
          onClick={() => {
            void handleOAuthSignIn("google");
          }}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
        >
          {oauthPendingProvider === "google" ? "Abrindo..." : "Entrar com Google"}
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
        <div className="h-px flex-1 bg-white/10" />
        ou email
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
