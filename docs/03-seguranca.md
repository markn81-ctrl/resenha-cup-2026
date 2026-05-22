# Seguranca

## Implementado

- Senhas armazenadas como hash com `bcrypt`.
- Validacao de entrada com Zod em cadastro, login, palpites, feed, comentarios, perfil e rotas admin.
- Autenticacao com Auth.js / NextAuth.
- Sessao em estrategia JWT.
- Controle de acesso por status de aprovacao.
- Controle de acesso administrativo por `Role.ADMIN`.
- Rotina cron protegida por `CRON_SECRET` em producao.
- Auditoria de cadastro, aprovacao, alteracao de perfil, palpites, posts, simulacoes, reset e rotinas automaticas.
- Healthcheck para banco, auth e IA.
- Preflight de producao para variaveis obrigatorias e alertas operacionais.

## Riscos e melhorias recomendadas

- Adicionar rate limit em login, cadastro, feed e comentarios.
- Adicionar headers HTTP de seguranca: CSP, HSTS, X-Frame-Options, Referrer-Policy e Permissions-Policy.
- Restringir `remotePatterns` de imagens para dominios conhecidos.
- Criar politica formal de backup, retencao e exclusao.
- Criar fluxo autenticado para solicitacoes LGPD.
- Registrar aceite de termos tambem em eventos de renovacao de versao.
- Revisar `allowDangerousEmailAccountLinking` antes de producao ampla.
