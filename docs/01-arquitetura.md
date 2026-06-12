# Arquitetura

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Auth.js / NextAuth
- OAuth Google e Apple, quando variaveis estiverem configuradas
- IA via OpenAI ou Gemini, conforme `AI_PROVIDER`

## Estrutura

- `app/`: paginas, layouts e rotas HTTP.
- `components/`: componentes de UI e fluxos de tela.
- `lib/`: regras de negocio, autenticacao, queries, IA, ranking e utilitarios.
- `prisma/`: schema, seeds e dados do torneio.
- `scripts/`: rotinas operacionais de launch, preflight e administracao.
- `tests/`: validacoes de pontuacao, lock e calendario.
- `docs/`: documentacao versionada.

## Fluxos centrais

1. Usuario cria conta ou entra por provedor externo.
2. Conta nova fica como `PENDING`.
3. Admin aprova ou rejeita.
4. Usuario aprovado acessa dashboard, jogos, ranking, feed, alertas e perfil.
5. Palpites podem ser criados ou editados ate o `lockAt`.
6. Admin simula e confirma o resultado oficial.
7. A transacao finaliza o jogo, avalia palpites e reconstroi ranking e status.
8. Resultados alimentam os comentarios da IA.
