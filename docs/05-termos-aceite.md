# Termos, Privacidade e Aceite

## Implementado

- Pagina publica `/terms`.
- Pagina publica `/privacy`.
- Checkbox de aceite na entrada da aplicacao.
- Cadastro por email exige `acceptTerms: true`.
- O banco registra:
  - `termsAcceptedAt`
  - `termsVersion`
  - `privacyAcceptedAt`
  - `privacyVersion`
  - `legalAcceptedIp`
  - `legalAcceptedUserAgent`
- O cadastro registra auditoria com versoes aceitas.
- Usuarios OAuth criados ou atualizados recebem data e versao de aceite quando entram pelo fluxo da tela publica.

## Limitacoes

- O aceite OAuth depende do fluxo visual da tela publica; chamadas diretas ao endpoint do provedor nao carregam o estado do checkbox.
- Ainda nao ha tela para renovar aceite quando a versao dos termos mudar.
- Ainda nao ha painel administrativo para consultar aceite por usuario.
- Os textos legais sao base operacional e precisam de revisao juridica antes de uso comercial amplo.
