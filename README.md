# Resenha Cup 2026

Aplicacao web privada para palpites da Copa do Mundo 2026 com cara de fantasy game, feed social e comentarios automaticos por IA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Auth.js / NextAuth
- OAuth Google e Apple
- OpenAI API

## O que ja vem pronto

- Autenticacao com Google, Apple e email/senha
- Fluxo de aprovacao privada com `PENDING`, `APPROVED` e `REJECTED`
- Schema Prisma completo para competicao, social e auditoria
- Seed demo com 48 selecoes, 104 jogos e dados iniciais de liga
- Engine de pontuacao com bonus, streak e multiplicadores por fase
- Dashboard, jogos, ranking, feed, notificacoes e painel admin
- Rotas para palpites, feed, comentarios, likes, aprovacoes e posts da IA
- Feed com posts de sistema, usuarios e IA

## Setup

1. Copie `.env.example` para `.env`
2. Preencha `DATABASE_URL`, `AUTH_SECRET` e credenciais OAuth
3. Instale dependencias
4. Gere o client Prisma
5. Rode migrations ou `db push`
6. Execute o seed
7. Suba a aplicacao

Comandos:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run seed
npm run dev
```

Checagem de pre-publicacao:

```bash
npm run preflight:prod
npm run release:check
```

Guia operacional de deploy:

- [DEPLOYMENT.md](C:/Users/bsbma/OneDrive/Documentos/New%20project/DEPLOYMENT.md)

## Seeds e reset

O projeto agora tem dois caminhos operacionais:

- `npm run seed`
  Usa o seed demo, com usuarios ficticios, ranking e feed de exemplo. Bom para desenvolvimento.
- `npm run seed:prod`
  Popula apenas a estrutura real do torneio: selecoes e 104 jogos. Nao cria usuarios fake nem ranking ficticio.
- `npm run reset:launch`
  Limpa os dados dinamicos para lancamento: usuarios comuns, palpites, ranking, feed, resultados, notificacoes e rivalidades.

O reset preserva contas `ADMIN` e tambem respeita `LAUNCH_ADMIN_EMAIL`.

Exemplo:

```bash
npm run reset:launch -- markn81@gmail.com
```

Se precisar promover sua conta real depois do primeiro login:

```bash
npm run promote:admin -- markn81@gmail.com
```

## Supabase

O projeto funciona bem com Supabase Postgres.

Checklist recomendado:

1. Crie um projeto no Supabase
2. No dashboard, abra `Connect`
3. Copie a string do `Session pooler` na porta `5432` para `DATABASE_URL`
4. Copie a string `Direct connection` para `DIRECT_URL`
5. Crie um usuario dedicado `prisma` no SQL Editor e use esse usuario na `DATABASE_URL`

SQL sugerido para o usuario Prisma:

```sql
create user "prisma" with password 'SUA_SENHA_FORTE' bypassrls createdb;
grant "prisma" to "postgres";
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

Para deploy serverless, troque `DATABASE_URL` para o pooler de transacao na porta `6543` com `pgbouncer=true&connection_limit=1`.

## Credenciais iniciais do seed

- Usuarios de teste:
  - senha padrao: `Senha12345!`

Observacao:

- O seed nao cria mais uma conta admin ficticia para evitar confusao com a conta real do dono do produto.
- Promova sua conta real para `ADMIN` usando o fluxo do projeto ou um script operacional.

## Checklist de lancamento

### 1. Banco limpo de producao

Idealmente, use um projeto Supabase novo para producao.

```bash
npm install
npm run prisma:generate
npm run db:push
npm run seed:prod
```

Se voce quiser reaproveitar o banco atual antes de convidar as pessoas:

```bash
npm run reset:launch -- markn81@gmail.com
npm run seed:prod
```

### 2. Conta admin real

1. Entre uma vez com Google na aplicacao.
2. Promova sua conta:

```bash
npm run promote:admin -- markn81@gmail.com
```

### 3. Variaveis de ambiente de producao

Configure no deploy:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `LAUNCH_ADMIN_EMAIL`

Voce tambem pode partir do arquivo:

- `.env.production.example`

Para producao, `AUTH_URL` e `NEXTAUTH_URL` devem apontar para o dominio final, por exemplo:

```env
AUTH_URL="https://resenhacup2026.com"
NEXTAUTH_URL="https://resenhacup2026.com"
```

### 4. Deploy 24/7

Stack recomendada:

- App Next.js: Vercel
- Banco: Supabase

Fluxo:

1. Suba o repositorio para GitHub
2. Importe o projeto na Vercel
3. Configure as variaveis de ambiente
4. Rode `npm run db:push`
5. Rode `npm run seed:prod`
6. Ajuste no Google Cloud o redirect URI de producao:
   `https://seu-dominio.com/api/auth/callback/google`
7. Teste login, aprovacao, palpite, ranking e feed

### 4.1 Healthcheck

Depois do deploy, valide rapidamente:

```bash
GET /api/health
```

O endpoint retorna:

- status geral da aplicacao
- conectividade com banco
- presenca das configuracoes essenciais de auth
- indicacao se OpenAI esta configurada

### 5. Antes de abrir para convidados

- Rotacione segredos usados em desenvolvimento
- Verifique se o Google OAuth tem os redirects de local e producao
- Teste sua conta admin no dominio final
- Gere um backup do Supabase
- Rode `npm run preflight:prod` antes do deploy final

## Regras principais

- Palpites travam automaticamente 2 horas antes de cada jogo
- Novos usuarios entram como `PENDING`
- Apenas admin acessa `/admin`
- Comentarios da IA podem ser publicados via `POST /api/ai/commentary`
- Ranking e status do jogador podem ser recalculados a partir da engine e snapshots

### Exemplo de payload para a IA

```json
{
  "scope": "OVERALL",
  "headline": "Rodada pegando fogo",
  "top3": ["Joao", "Maria", "Carlos"],
  "biggestRise": "Pedro",
  "biggestFall": "Lucas",
  "exactScoreHits": ["Maria"],
  "totalMisses": ["Carlos"],
  "streak": {
    "Joao": 4
  },
  "rankingChanges": [
    "Pedro entrou no top 5",
    "Lucas caiu 3 posicoes"
  ],
  "hotStreaks": [
    "Joao vem de 4 acertos seguidos"
  ],
  "coldStreaks": [
    "Carlos zerou a rodada"
  ],
  "matchResults": [
    "Brasil 2 x 0 Japao",
    "Portugal 1 x 1 Mexico"
  ],
  "matchSummary": "A rodada embaralhou o topo da tabela"
}
```

## Observacoes de produto

- O seed usa grupos demonstrativos para as 48 selecoes e placeholders de chaveamento nas fases eliminatorias, o que facilita operar a liga antes da definicao oficial do torneio.
- O app possui fallbacks visuais para demo quando o banco ainda nao foi populado, mas a operacao real depende de PostgreSQL configurado.

## Proximos passos recomendados

- Agendar job para recalcular ranking ao fim de cada jogo e rodada
- Conectar webhook ou cron para gerar posts da IA automaticamente
- Adicionar upload de avatar e preferencia de timezone por usuario
- Incluir testes para engine de pontuacao, locks e middleware de acesso
