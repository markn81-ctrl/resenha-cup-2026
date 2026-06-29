import Image from "next/image";
import { Swords, Target } from "lucide-react";
import { LeaderboardScope } from "@prisma/client";
import { Panel } from "@/components/ui/panel";
import { formatPoints, formatRankPosition, getAvatarFallback } from "@/lib/utils";

const scopeLabel: Record<LeaderboardScope, string> = {
  OVERALL: "Geral",
  GROUP_STAGE: "Fase de grupos",
  KNOCKOUT: "Mata-mata"
};

export function RivalryCard({
  rivalry
}: {
  rivalry: {
    rivalId: string;
    name: string;
    username: string;
    image?: string | null;
    position: number;
    points: number;
    pointsGap: number;
    score: number;
    scope: LeaderboardScope;
    trendLabel: string;
  } | null;
}) {
  if (!rivalry) {
    return (
      <Panel>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Rivalidade</p>
        <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
          Rival ainda em definicao
        </h3>
        <p className="mt-3 text-sm text-slate-300">
          Quando o ranking ganhar mais corpo, o sistema escolhe automaticamente quem esta travando o duelo mais quente com voce.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Seu rival da vez</p>
          <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
            Duelo aceso em {scopeLabel[rivalry.scope]}
          </h3>
        </div>
        <div className="rounded-2xl bg-accent-300/15 p-3 text-accent-100">
          <Swords className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-3xl border border-white/8 bg-white/5 p-4">
        {rivalry.image ? (
          <Image
            src={rivalry.image}
            alt={`Foto de perfil de ${rivalry.name}`}
            width={56}
            height={56}
            className="h-14 w-14 rounded-[20px] object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-accent-300 text-base font-bold text-slate-950">
            {getAvatarFallback(rivalry.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{rivalry.name}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">@{rivalry.username}</p>
          <p className="mt-2 text-sm text-slate-300">{rivalry.trendLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Posicao dele</p>
          <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
            {formatRankPosition(rivalry.position)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Gap atual</p>
          <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
            {formatPoints(rivalry.pointsGap)}
          </p>
          <p className="mt-1 text-xs text-slate-400">pontos de diferenca</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <Target className="h-3.5 w-3.5" />
            Intensidade
          </div>
          <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold">
            {Math.round(rivalry.score)}
          </p>
          <p className="mt-1 text-xs text-slate-400">score da rivalidade</p>
        </div>
      </div>
    </Panel>
  );
}
