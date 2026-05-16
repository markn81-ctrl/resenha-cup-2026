import type { NotificationView } from "@/types/app";
import { Panel } from "@/components/ui/panel";
import { relativeTime } from "@/lib/utils";

export function NotificationList({ items }: { items: NotificationView[] }) {
  return (
    <div className="space-y-4">
      {!items.length ? (
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Sem alertas</p>
          <h2 className="mt-2 text-xl font-semibold">Tudo limpo por enquanto</h2>
          <p className="mt-2 text-sm text-slate-300">
            Quando houver aprovacao, comentario, mudanca no ranking ou lembrete de palpite, o sininho chama.
          </p>
        </Panel>
      ) : null}
      {items.map((item) => (
        <Panel key={item.id} className={item.isRead ? "opacity-80" : "border-brand-300/30"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.type}</p>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </div>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {relativeTime(item.createdAt)}
            </span>
          </div>
        </Panel>
      ))}
    </div>
  );
}
