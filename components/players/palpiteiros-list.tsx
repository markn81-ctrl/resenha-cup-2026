import Image from "next/image";
import { Role } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAvatarFallback, formatPoints, formatRankPosition, relativeTime } from "@/lib/utils";
import type { PalpiteiroView } from "@/types/app";

export function PalpiteirosList({
  players,
  currentUserId
}: {
  players: PalpiteiroView[];
  currentUserId?: string | null;
}) {
  if (!players.length) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/5 p-5 text-sm text-slate-300">
        Ainda nao tem palpiteiro aprovado por aqui. Assim que voce liberar os convites, a lista ganha vida.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => (
        <article
          key={player.id}
          className={
            currentUserId === player.id
              ? "rounded-[24px] border border-brand-300/35 bg-brand-400/10 p-4"
              : "rounded-[24px] border border-white/8 bg-white/5 p-4"
          }
        >
          <div className="flex items-start gap-3">
            {player.image ? (
              <Image
                src={player.image}
                alt={`Foto de perfil de ${player.name}`}
                width={56}
                height={56}
                className="h-14 w-14 rounded-[20px] object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-brand-400 text-base font-bold text-slate-950">
                {getAvatarFallback(player.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold">{player.name}</h3>
                {player.role === Role.ADMIN ? (
                  <span className="rounded-full border border-accent-300/40 bg-accent-300/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-100">
                    Admin
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-400">
                @{player.username}
              </p>
              <p className="mt-1 text-xs text-slate-500">Entrou {relativeTime(player.createdAt)}</p>
            </div>
          </div>

          {player.bio ? (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-300">{player.bio}</p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Bio ainda em branco. Misterio tambem e estrategia.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge tier={player.tier} />
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {player.rankPosition ? formatRankPosition(player.rankPosition) : "Sem ranking"}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {formatPoints(player.points)} pts
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-950/35 p-3">
              <p className="text-lg font-bold">{player.predictionsCount}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                palpites
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/35 p-3">
              <p className="text-lg font-bold">{player.postsCount}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">posts</p>
            </div>
            <div className="rounded-2xl bg-slate-950/35 p-3">
              <p className="text-lg font-bold">{player.commentsCount}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                resenhas
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
