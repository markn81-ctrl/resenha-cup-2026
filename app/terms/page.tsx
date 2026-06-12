import Link from "next/link";
import { LEGAL_CONTACT_EMAIL, LEGAL_TERMS_VERSION } from "@/lib/legal";

const rules = [
  "A Resenha Cup 2026 e uma liga privada de palpites da Copa do Mundo 2026.",
  "Contas novas entram como pendentes e dependem de aprovacao manual do administrador.",
  "Palpites travam automaticamente 2 horas antes do inicio de cada partida.",
  "Depois do lock, o palpite nao pode ser criado ou alterado.",
  "Ranking, pontuacao, notificacoes e feed seguem as regras implementadas no sistema.",
  "Publicacoes, comentarios e nomes de perfil devem respeitar os demais participantes."
];

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link className="text-sm text-brand-100 underline underline-offset-4" href="/">
        Voltar para entrada
      </Link>

      <article className="mt-8 glass rounded-[28px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">
          Versao {LEGAL_TERMS_VERSION}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold">
          Termos de Uso
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          Estes termos definem as regras de uso da Resenha Cup 2026. O texto serve como base
          operacional do produto e deve ser revisado juridicamente antes de uso comercial amplo.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">
            Regras principais
          </h2>
          <ul className="grid gap-3">
            {rules.map((rule) => (
              <li key={rule} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-slate-300">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
            IA, ranking e conteudo
          </h2>
          <p>
            A aplicacao pode gerar comentarios automaticos por IA com base em resultados,
            movimentacoes de ranking e eventos da liga. Esses comentarios sao informativos e
            recreativos, sem efeito sobre a pontuacao oficial.
          </p>
          <p>
            O administrador pode aprovar acessos, simular e registrar resultados oficiais,
            publicar posts da IA, alterar nomes de jogadores e executar rotinas operacionais
            previstas no sistema.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-slate-300">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
            Contato
          </h2>
          <p>
            Duvidas, pedidos sobre conta ou contestacoes podem ser enviados para{" "}
            <a className="font-semibold text-brand-100 underline underline-offset-4" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
