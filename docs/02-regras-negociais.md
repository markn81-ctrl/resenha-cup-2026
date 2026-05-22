# Regras Negociais

## Acesso

- Todo usuario novo entra como `PENDING`.
- Apenas usuarios `APPROVED` acessam as areas internas.
- Rotas administrativas exigem `Role.ADMIN`.
- O admin pode aprovar, rejeitar, simular resultados, publicar posts de IA e executar reset de lancamento.

## Palpites

- Cada usuario pode ter apenas um palpite por jogo.
- O indice unico `userId + matchId` impede duplicidade.
- Palpites travam 2 horas antes do inicio da partida.
- Depois do lock, a API bloqueia criacao e edicao.
- O resultado escolhido deve bater com o placar informado.
- O usuario pode escolher no maximo 2 artilheiros.
- Quando a lista oficial de jogadores existe, artilheiros precisam pertencer ao jogo.

## Pontuacao

- Vencedor ou empate correto: 3 pontos.
- Placar exato: 6 pontos.
- Artilheiro correto: 3 pontos por jogador, limitado a 2.
- Time com mais cartoes correto: 2 pontos.
- Faixa de cartoes correta: 2 pontos.
- Acerto conjunto de time e faixa de cartoes: bonus de 2 pontos.
- Vencedor + placar exato: bonus de 2 pontos.
- Sequencia de 3 acertos de vencedor: bonus de 2 pontos.
- Sequencia de 5 acertos de vencedor: bonus de 5 pontos.

## Multiplicadores

- Fase de grupos: x1.0
- 32 avos: x1.2
- 16 avos: x1.3
- Quartas: x1.4
- Semifinal: x1.6
- Terceiro lugar: x1.3
- Final: x2.0

## Ranking

O ranking ordena por pontos totais. Em empate, usa placares exatos e vencedores corretos como criterios adicionais.
