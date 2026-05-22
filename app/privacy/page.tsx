import Link from "next/link";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_PRIVACY_VERSION
} from "@/lib/legal";

const dataItems = [
  "Identificacao: nome, username, email e imagem de perfil quando fornecida.",
  "Autenticacao: contas OAuth, sessoes e hash de senha para login por email.",
  "Uso do produto: palpites, pontuacao, ranking, posts, comentarios, curtidas e notificacoes.",
  "Operacao e auditoria: registros de acoes administrativas, cadastro, aceite, alteracoes de perfil e palpites."
];

const rights = [
  "confirmar se ha tratamento de dados pessoais;",
  "acessar dados pessoais relacionados a sua conta;",
  "corrigir dados incompletos, inexatos ou desatualizados;",
  "solicitar anonimizacao, bloqueio ou eliminacao quando aplicavel;",
  "revogar consentimento quando essa for a base usada para determinado tratamento;",
  "pedir informacoes sobre compartilhamento de dados."
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link className="text-sm text-brand-100 underline underline-offset-4" href="/">
        Voltar para entrada
      </Link>

      <article className="mt-8 glass rounded-[28px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-200">
          Versao {LEGAL_PRIVACY_VERSION}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold">
          Politica de Privacidade
        </h1>
        <p className="mt-4 leading-7 text-slate-300">
          Esta politica descreve como a Resenha Cup 2026 trata dados pessoais para operar
          uma liga privada de palpites, ranking e feed social. O texto e uma base operacional
          e deve passar por revisao juridica antes de uso comercial amplo.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">
            Dados tratados
          </h2>
          <ul className="grid gap-3">
            {dataItems.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-slate-300">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
            Finalidades
          </h2>
          <p>
            Os dados sao usados para autenticar participantes, controlar aprovacao de acesso,
            registrar palpites, calcular ranking, operar feed e notificacoes, proteger a liga
            contra abuso e manter auditoria operacional.
          </p>
          <p>
            Dados podem ser armazenados em provedores necessarios ao funcionamento da aplicacao,
            como hospedagem, banco de dados, autenticacao OAuth e provedor de IA quando ativado.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">
            Direitos do titular
          </h2>
          <ul className="grid gap-3">
            {rights.map((right) => (
              <li key={right} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                Voce pode {right}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-slate-300">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
            Canal de atendimento
          </h2>
          <p>
            Para exercer direitos relacionados a dados pessoais, envie uma mensagem para{" "}
            <a className="font-semibold text-brand-100 underline underline-offset-4" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
            . Algumas solicitacoes podem exigir verificacao de identidade e podem ser recusadas
            quando houver obrigacao legal, seguranca, auditoria ou exercicio regular de direitos.
          </p>
        </section>
      </article>
    </main>
  );
}
