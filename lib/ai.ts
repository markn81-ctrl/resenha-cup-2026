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
- Humor leve, ironico e inteligente
- Pode provocar e brincar, mas sem ofender
- Estilo resenha entre amigos
- Use expressoes comuns do Brasil como: ta voando, sumiu, apagado, cravou bonito, pipocou, ta complicado
- Pode usar emojis com moderacao

REGRAS IMPORTANTES
- Nunca use linguagem ofensiva, preconceituosa ou agressiva
- Nunca exponha ou humilhe diretamente um usuario
- Zoar sim, humilhar nunca
- Sempre manter clima divertido

TAREFA
- Gerar um unico post curto para o feed
- Maximo de 2 a 3 frases
- Variar entre elogio, zoeira leve e analise divertida
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
    escopo: input.scope
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
  const top3 = input.top3?.length ? `Top 3 no radar: ${input.top3.join(", ")}.` : null;
  const rise = input.biggestRise ? `${input.biggestRise} subiu bonito e baguncou a mesa.` : null;
  const fall = input.biggestFall ? `${input.biggestFall} deu aquela escorregada, hein.` : null;
  const exact = input.exactScoreHits?.[0]
    ? `${input.exactScoreHits[0]} cravou placar e veio forte.`
    : null;

  return [input.headline, input.matchSummary, rise ?? exact, fall ?? top3, "Essa rodada mexeu com todo mundo 😅"]
    .filter(Boolean)
    .join(" ");
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
