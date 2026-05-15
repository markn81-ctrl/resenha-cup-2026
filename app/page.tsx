import Image from "next/image";
import { ArrowRight, Sparkles, Trophy, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getAvatarFallback, getDisplayName } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();
  const profileName = getDisplayName({
    name: session?.user?.name,
    email: session?.user?.email,
    username: session?.user?.username
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-brand-100">
            <Sparkles className="h-4 w-4" />
            Fantasy social da Copa 2026
          </div>

          <div>
            <h1 className="max-w-4xl font-[family-name:var(--font-heading)] text-5xl font-bold leading-[0.95] sm:text-7xl">
              Palpite, zoeira e ranking ao vivo numa mesa que nao perdoa.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Resenha Cup mistura bolao, feed social e disputa de fantasy para transformar cada jogo da Copa em uma mini rivalidade diaria.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-[28px] p-5">
              <Users className="h-6 w-6 text-brand-200" />
              <h2 className="mt-4 text-xl font-semibold">Rede social interna</h2>
              <p className="mt-2 text-sm text-slate-300">
                Feed com curtidas, comentarios, respostas e provocacao saudavel.
              </p>
            </div>
            <div className="glass rounded-[28px] p-5">
              <Trophy className="h-6 w-6 text-accent-200" />
              <h2 className="mt-4 text-xl font-semibold">Ranking competitivo</h2>
              <p className="mt-2 text-sm text-slate-300">
                Pontuacao detalhada, badges dinamicas e movimento em tempo real.
              </p>
            </div>
            <div className="glass rounded-[28px] p-5">
              <ArrowRight className="h-6 w-6 text-sky-200" />
              <h2 className="mt-4 text-xl font-semibold">IA com voz de resenha</h2>
              <p className="mt-2 text-sm text-slate-300">
                Comentarios automaticos que reagem a subida, queda e caos de rodada.
              </p>
            </div>
          </div>

          {session?.user ? (
            <div className="glass rounded-[28px] p-5 text-sm text-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={`Foto de perfil de ${profileName}`}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400 text-xl font-bold text-slate-950">
                      {getAvatarFallback(profileName)}
                    </div>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Seu perfil</p>
                    <p className="mt-1 text-xl font-semibold">{profileName}</p>
                    <p className="text-sm text-slate-400">{session.user.email}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <p>
                    Sessao ativa. Se sua conta ja estiver aprovada, entre direto em{" "}
                    <a
                      className="font-semibold text-brand-100 underline underline-offset-4"
                      href="/dashboard"
                    >
                      /dashboard
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <SignInPanel />
      </div>
    </main>
  );
}
