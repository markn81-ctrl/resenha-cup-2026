import { ApprovalStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUnreadNotificationsCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";

const baseRules = [
  { label: "Acertar vencedor ou empate", points: "+3" },
  { label: "Acertar placar exato", points: "+6" },
  { label: "Acertar jogador que marcou gol", points: "+3 cada" },
  { label: "Limite de artilheiros no palpite", points: "2 jogadores" },
  { label: "Time com mais amarelos", points: "+2" },
  { label: "Faixa correta de cartões", points: "+2" },
  { label: "Bônus por acertar time dos cartões e faixa", points: "+2" }
];

const bonusRules = [
  { label: "Vencedor + placar exato no mesmo jogo", points: "+2" },
  { label: "Sequencia de 3 acertos de vencedor", points: "+2" },
  { label: "Sequencia de 5 acertos de vencedor e reset do ciclo", points: "+5" }
];

const multipliers = [
  { phase: "Fase de grupos", multiplier: "x1.0" },
  { phase: "32 avos", multiplier: "x1.2" },
  { phase: "16 avos", multiplier: "x1.3" },
  { phase: "Quartas", multiplier: "x1.4" },
  { phase: "Semifinal", multiplier: "x1.6" },
  { phase: "Final", multiplier: "x2.0" }
];

export default async function RulesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    redirect("/pending");
  }

  const unreadNotifications = await getUnreadNotificationsCount(session.user.id);

  return (
    <AppShell
      title="Regras de Pontuacao"
      subtitle="Consulta rapida para ninguem dizer que esqueceu como a resenha pontua."
      currentPath="/rules"
      user={session.user}
      unreadNotifications={unreadNotifications}
    >
      <div className="space-y-4">
        <Panel className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-200">Resumo da partida</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
                Onde os pontos aparecem
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Cada jogo mistura resultado, placar, artilheiros e cartões. O placar exato é o golpe bonito,
                mas cartão e artilheiro podem salvar aquele palpite que parecia perdido no segundo tempo.
              </p>
            </div>
            <div className="rounded-[26px] border border-brand-300/20 bg-brand-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-100">Regra de ouro</p>
              <p className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold">
                Palpites travam 10 minutos antes do jogo.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Depois do lock, não dá para editar. Nem chorando no grupo, nem pedindo revisão para a IAestagiaria.
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Base</p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              Pontuação principal
            </h2>
            <div className="mt-4 space-y-3">
              {baseRules.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-200">{rule.label}</span>
                  <span className="rounded-full bg-brand-400 px-3 py-1 text-sm font-bold text-slate-950">
                    {rule.points}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Bônus</p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
              O tempero da zoeira
            </h2>
            <div className="mt-4 space-y-3">
              {bonusRules.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-200">{rule.label}</span>
                  <span className="rounded-full bg-accent-300 px-3 py-1 text-sm font-bold text-slate-950">
                    {rule.points}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Sequencia considera acertos de vencedor/empate. A partir do Jogo 48, o ciclo paga +2 no terceiro acerto, +5 no quinto acerto e zera para recomecar uma nova sequencia.
            </p>
          </Panel>
        </div>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mata-mata</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Multiplicadores por fase
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {multipliers.map((item) => (
              <div key={item.phase} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-sm text-slate-400">{item.phase}</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
                  {item.multiplier}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Exemplo rápido</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Palpite perfeito na fase de grupos
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Se você acerta vencedor, placar exato, 2 artilheiros, time dos cartões e faixa de cartões:
            3 + 6 + 6 + 2 + 2 + 2 de bônus dos cartões + 2 de bônus vencedor/placar = 23 pontos.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Em fases de mata-mata, esse total ainda passa pelo multiplicador da fase. Na final, a mesma pancada dobra.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
