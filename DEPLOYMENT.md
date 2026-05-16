# Deploy Resenha Cup 2026

Guia objetivo para colocar o app no ar com Vercel + Supabase.

## 1. Banco de producao

No Supabase:

1. Crie um projeto novo para producao.
2. Copie:
   - `DATABASE_URL` com pooler `6543`
   - `DIRECT_URL` com conexao direta `5432`
3. No projeto local, valide o ambiente:

```bash
npm run preflight:prod
```

4. Aplique a estrutura do banco:

```bash
npm run prisma:generate
npm run db:push
npm run seed:prod
```

5. Garanta sua conta admin:

```bash
npm run promote:admin -- markn81@gmail.com
```

## 2. Variaveis de ambiente na Vercel

Cadastre estas variaveis:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_APPLE_ID`
- `AUTH_APPLE_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `LAUNCH_ADMIN_EMAIL`
- `CRON_SECRET`

Base recomendada:

- [`.env.production.example`](C:/Users/bsbma/OneDrive/Documentos/New%20project/.env.production.example)

## 3. Google OAuth

No Google Cloud:

- `Authorized JavaScript origins`
  - `https://seu-dominio.com`
- `Authorized redirect URIs`
  - `https://seu-dominio.com/api/auth/callback/google`

Se ainda quiser manter local:

- `http://localhost:3000`
- `http://localhost:3000/api/auth/callback/google`

## 4. Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as env vars.
4. Faça o primeiro deploy.
5. Depois do build, teste:

- `/`
- `/dashboard`
- `/admin`
- `/api/health`

## 5. Healthcheck esperado

Abra:

- `https://seu-dominio.com/api/health`

Resultado esperado:

- `status: "ok"`
- `checks.database: true`
- `checks.auth.secret: true`
- `checks.auth.authUrl: true`
- `checks.auth.nextAuthUrl: true`

`checks.ai.configured` pode ficar `false` se voce quiser publicar sem a IA ligada no primeiro momento.

## 6. Rotinas automaticas

O arquivo `vercel.json` agenda a rota `/api/cron/pick-lock-reminders` a cada 5 minutos.

Essa rotina:

- identifica jogos cujo palpite fecha nos proximos 15 minutos
- cria notificacoes para usuarios aprovados que ainda nao palpitaram
- publica um post da IAestagiaria no feed
- evita duplicidade usando `AuditLog`

Para funcionar em producao, cadastre `CRON_SECRET` na Vercel. A rota so aceita chamadas com o header `Authorization: Bearer <CRON_SECRET>`.

## 7. Checklist final de lancamento

- rodar `npm run release:check`
- confirmar dominio final em `AUTH_URL` e `NEXTAUTH_URL`
- confirmar callback do Google
- confirmar `CRON_SECRET`
- conferir a aba Cron Jobs na Vercel
- testar login com sua conta real
- testar aprovacao de usuario
- testar criacao de palpite
- testar feed e notificacoes
- testar `/api/health`
- fazer backup do Supabase

## 8. Sequencia recomendada no dia do lancamento

```bash
npm run reset:launch -- markn81@gmail.com
npm run seed:prod
npm run promote:admin -- markn81@gmail.com
npm run release:check
```

Depois disso:

1. deploy na Vercel
2. login com Google
3. aprovacao dos primeiros convidados
