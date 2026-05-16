import OpenAI from "openai";
import { FeedPostType, LeaderboardScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type CommentaryInput = {
  scope: LeaderboardScope;
  headline: string;
  top3?: string[];
  biggestRise?: string | null;
  biggestFall?: string | null;
  exactScoreHits?: string[];
  totalMisses?: string[];
  streak?: Record<string, number>;
  rankingChanges: string[];
  hotStreaks: string[];
  coldStreaks: string[];
  currentRanking?: Array<{
    name: string;
    position: number;
    points: number;
  }>;
  matchResults?: string[];
  matchSummary?: string;
};

const BRAZILIAN_FEED_SYSTEM_PROMPT = `
Voce e um comentarista esportivo brasileiro com personalidade carismatica, bem-humorada e levemente provocativa, como um amigo zoeiro em grupo de WhatsApp durante a Copa do Mundo.
Seu nome no produto e IAestagiaria.

OBJETIVO
Gerar um post curto, divertido e envolvente para um feed social de um jogo de palpites da Copa do Mundo.

TOM DE VOZ
- Brasileiro, natural e descontraido
- Humor leve, ironico, inteligente e com cara de resenha de grupo
- Pode provocar e brincar, mas sem ofender
- Estilo resenha entre amigos
- Use expressoes comuns do Brasil como: ta voando, sumiu, apagado, cravou bonito, pipocou, ta complicado, isso ai virou novela, olha o crime, hoje tem auditoria
- Pode usar emojis com moderacao

REGRAS IMPORTANTES
- Nunca use linguagem ofensiva, preconceituosa ou agressiva
- Nunca exponha ou humilhe diretamente um usuario
- Quando citar alguem em fase ruim, provoque a situacao, nao a pessoa
- Zoar sim, humilhar nunca
- Sempre manter clima divertido
- Nao use sempre a mesma estrutura de frase
- Nao comece sempre com "Rapaz", "Joao ta" ou "Essa rodada"
- Nao repita bordoes usados nos exemplos se houver outra forma natural
- Evite parecer comunicado oficial

TAREFA
- Gerar um unico post curto para o feed
- Maximo de 2 a 3 frases
- Variar entre elogio, zoeira leve e analise divertida
- Se o contexto for fraco, invente uma resenha generica sobre a tensao do bolao sem criar fatos falsos
- Retorne apenas o texto final do post, sem explicacoes
`.trim();

function buildPromptPayload(input: CommentaryInput) {
  return {
    top3: input.top3 ?? [],
    maior_subida: input.biggestRise ?? null,
    maior_queda: input.biggestFall ?? null,
    placar_cravado: input.exactScoreHits ?? [],
    errou_tudo: input.totalMisses ?? [],
    streak: input.streak ?? {},
    ranking_atual: input.currentRanking ?? [],
    mudancas_ranking: input.rankingChanges,
    destaques_quentes: input.hotStreaks,
    destaques_frios: input.coldStreaks,
    resultados_jogos: input.matchResults ?? [],
    resumo_rodada: input.matchSummary ?? null,
    manchete: input.headline,
    escopo: input.scope,
    pedido_de_variacao:
      "Crie uma frase nova, com ritmo diferente das anteriores, mantendo zoeira saudavel e sem humilhar ninguem."
  };
}

export async function generateAiCommentary(input: CommentaryInput) {
  const fallback = buildFallbackCommentary(input);

  if (!openai) {
    return fallback;
  }

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      temperature: 0.95,
      input: [
        {
          role: "system",
          content: BRAZILIAN_FEED_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify(buildPromptPayload(input))
        }
      ]
    });

    return response.output_text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export function buildFallbackCommentary(input: CommentaryInput) {
  const top3 = input.top3?.length ? input.top3.join(", ") : null;
  const exact = input.exactScoreHits?.[0] ?? null;
  const misses = input.totalMisses?.[0] ?? null;
  const streakEntry = Object.entries(input.streak ?? {}).sort((a, b) => b[1] - a[1])[0];

  const templates = [
    () =>
      `${input.headline} ${input.matchSummary ?? "A mesa ja comecou a fazer conta de guardanapo."} Quem bobear agora vai virar pauta da resenha.`,
    () =>
      input.biggestRise
        ? `${input.biggestRise} deu aquela arrancada que faz o ranking pedir VAR. Se mantiver esse ritmo, vai ter gente fingindo que nem viu.`
        : `${input.headline} A rodada veio com cheiro de confusao boa e zero paciencia para palpite morno.`,
    () =>
      input.biggestFall
        ? `${input.biggestFall} escorregou na tabela e a torcida da zoeira ja abriu os trabalhos. Calma que ainda da para reagir sem chamar isso de crise.`
        : `${input.headline} O topo esta tao apertado que um placar cravado ja vira golpe de estado esportivo.`,
    () =>
      exact
        ? `${exact} cravou bonito e deixou o grupo naquele silencio suspeito. Tem palpite que parece sorte, mas a pessoa vai jurar que foi estudo.`
        : `${input.headline} Hoje e dia de palpite com coragem, porque em cima do muro nem a IAestagiaria defende.`,
    () =>
      streakEntry
        ? `${streakEntry[0]} emendou ${streakEntry[1]} acertos e ja esta andando com pose de tecnico campeao. O problema e que soberba em bolao costuma cobrar juros.`
        : `${input.matchSummary ?? input.headline} A resenha esta oficialmente autorizada a desconfiar de qualquer placar perfeito.`,
    () =>
      misses
        ? `${misses} teve uma rodada daquelas para apagar do historico e culpar o gramado. Faz parte: ate palpite ruim movimenta o feed.`
        : `Top 3 no radar: ${top3 ?? "ainda sem dono absoluto"}. Quem esta atras precisa reagir antes que o lider comece a pedir musica.`
  ];

  return templates[Math.floor(Math.random() * templates.length)]();
}

export async function publishAiCommentary(input: CommentaryInput) {
  const content = await generateAiCommentary(input);

  return prisma.feedPost.create({
    data: {
      type: FeedPostType.AI_COMMENTARY,
      content,
      metadata: input
    }
  });
}
