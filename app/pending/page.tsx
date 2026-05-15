import { Clock3, ShieldCheck } from "lucide-react";
import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function PendingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus === ApprovalStatus.APPROVED) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6">
      <section className="glass w-full rounded-[32px] p-8">
        <div className="inline-flex rounded-full bg-amber-400/15 p-3 text-amber-200">
          <Clock3 className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-4xl font-bold">
          Conta em aprovacao
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          {session?.user?.name ?? "Sua conta"} ja entrou na fila. O admin precisa liberar o acesso antes de voce participar do ranking.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <ShieldCheck className="h-6 w-6 text-brand-200" />
            <h2 className="mt-4 text-xl font-semibold">Fluxo privado</h2>
            <p className="mt-2 text-sm text-slate-300">
              Toda conta nova entra como pendente para manter a liga fechada entre amigos.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <Clock3 className="h-6 w-6 text-accent-200" />
            <h2 className="mt-4 text-xl font-semibold">Assim que liberar</h2>
            <p className="mt-2 text-sm text-slate-300">
              Dashboard, palpites, ranking, feed e notificacoes vao aparecer automaticamente.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
