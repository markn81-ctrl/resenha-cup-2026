import OpenAI from "openai";
import { FeedPostType, LeaderboardScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL:
        process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/"
    })
  : null;

const aiProvider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

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
  rankingBattles?: string[];
  bottomWatch?: string[];
  upcomingMatches?: string[];
  matchResults?: string[];
  matchSummary?: string;
  recentPosts?: string[];
  avoidTerms?: string[];
  focus?: string;
  timeContext?: {
    localDate: string;
    daysUntilWorldCup: number;
    openingMatchDate: string;
    tournamentStatus: "pre_world_cup" | "in_progress" | "finished";
  };
  newMembers?: string[];
  communityStats?: {
    totalUsers: number;
    approvedUsers: number;
    pendingUsers: number;
  };
  dailyTopic?: string;
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
- Use expressoes comuns do Brasil, mas varie bastante: ta voando, sumiu, apagado, cravou bonito, pipocou, ta complicado, isso ai virou novela, olha o crime, acordou para o jogo, encostou no pelotao
- Pode usar emojis com moderacao

REGRAS IMPORTANTES
- Nunca use linguagem ofensiva, preconceituosa ou agressiva
- Nunca exponha ou humilhe diretamente um usuario
- Quando citar alguem em fase ruim, provoque a situacao, nao a pessoa
- A IAestagiaria deve estar sempre focada em Copa do Mundo 2026, Resenha Cup e clima de bolao entre amigos
- Antes do inicio da Copa, use contagem regressiva, expectativa, preparacao dos palpites, provocacoes leves e boas-vindas aos novos integrantes
- Interaja com o tempo quando houver contexto: hoje, faltam X dias, esta chegando, semana de aquecimento, contagem regressiva
- Se houver novos integrantes, receba a galera com humor leve e chame para participar do feed
- Nao invente noticia oficial, escalação, lesao, resultado ou curiosidade especifica se isso nao estiver nos dados recebidos
- Zoar sim, humilhar nunca
- Sempre manter clima divertido
- Nao use sempre a mesma estrutura de frase
- Nao comece sempre com "Rapaz", "Joao ta" ou "Essa rodada"
- Nao repita bordoes usados nos exemplos se houver outra forma natural
- Evite repetir assunto, nomes e bordoes dos posts recentes enviados no contexto
- Se houver termos_para_evitar, nao use esses termos
- Durante a Copa, varie o foco entre topo, perseguidores, meio da tabela, fundo da tabela, proximos jogos e ultimos resultados
- Nao fale sempre do lider; quando possivel, traga disputa de posicoes, aproximacao, ultrapassagem ameacada ou tentativa de recuperacao
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
    disputas_ranking: input.rankingBattles ?? [],
    zona_de_recuperacao: input.bottomWatch ?? [],
    proximos_jogos: input.upcomingMatches ?? [],
    mudancas_ranking: input.rankingChanges,
    destaques_quentes: input.hotStreaks,
    destaques_frios: input.coldStreaks,
    resultados_jogos: input.matchResults ?? [],
    resumo_rodada: input.matchSummary ?? null,
    posts_recentes_da_ia: input.recentPosts ?? [],
    termos_para_evitar: input.avoidTerms ?? [],
    foco_do_post: input.focus ?? null,
    manchete: input.headline,
    escopo: input.scope,
    contexto_tempo: input.timeContext ?? null,
    novos_integrantes: input.newMembers ?? [],
    estatisticas_comunidade: input.communityStats ?? null,
    tema_do_dia: input.dailyTopic ?? null,
    pedido_de_variacao:
      "Crie uma frase nova, com ritmo diferente das anteriores, mantendo zoeira saudavel e sem humilhar ninguem."
  };
}

export async function generateAiCommentary(input: CommentaryInput) {
  const fallback = buildFallbackCommentary(input);

  if (aiProvider === "gemini") {
    return generateGeminiCommentary(input, fallback);
  }

  if (aiProvider === "openai") {
    return generateOpenAiCommentary(input, fallback);
  }

  return fallback;
}

async function generateGeminiCommentary(input: CommentaryInput, fallback: string) {
  if (!gemini) {
    return fallback;
  }

  try {
    const response = await gemini.chat.completions.create({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      temperature: 0.95,
      messages: [
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

    return response.choices[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function generateOpenAiCommentary(input: CommentaryInput, fallback: string) {
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
  const daysUntil = input.timeContext?.daysUntilWorldCup;
  const newMembers = input.newMembers?.length ? input.newMembers.join(", ") : null;
  const battle = input.rankingBattles?.[0] ?? null;
  const bottom = input.bottomWatch?.[0] ?? null;
  const upcoming = input.upcomingMatches?.[0] ?? null;
  const resultLine = input.matchResults?.length
    ? `Fechando o dia: ${input.matchResults.slice(0, 2).join(" | ")}.`
    : null;

  if (input.timeContext?.tournamentStatus === "in_progress") {
    const inProgressTemplates = [
      () =>
        `${resultLine ?? input.matchSummary ?? input.headline} ${battle ?? "A tabela segue em modo aperto, com gente olhando para cima e para baixo ao mesmo tempo."}`,
      () =>
        battle
          ? `${battle}. Esse tipo de distancia curta transforma cada proximo palpite em chance real de ultrapassagem.`
          : `${input.headline} A briga esta menos sobre liderar bonito e mais sobre nao deixar o pelotao respirar no cangote.`,
      () =>
        bottom
          ? `${bottom}. O fundo da tabela ainda tem saida, mas agora cada pontinho vale aquele drama de fim de rodada.`
          : `${input.headline} Quem esta atras ainda tem estrada, mas precisa transformar palpite em recuperacao.`,
      () =>
        upcoming
          ? `Proximo alvo da resenha: ${upcoming}. Quem acertar esse pode acordar amanha com a tabela olhando diferente.`
          : `${input.headline} A rodada nao acabou e o ranking ja esta fazendo conta com cara de quem vai aprontar.`,
      () =>
        exact
          ? `${exact} acertou no detalhe e colocou pressao no resto da mesa. Agora o ranking nao perdoa palpite morno.`
          : `${resultLine ?? input.headline} Top 3 no radar: ${top3 ?? "ainda sem dono absoluto"}, mas o perigo vem chegando pelo retrovisor.`,
      () =>
        streakEntry
          ? `${streakEntry[0]} emendou ${streakEntry[1]} acertos e ja esta andando com pose de quem estudou a rodada. Vamos ver se sustenta quando a tabela apertar.`
          : `${input.matchSummary ?? input.headline} A resenha fecha o dia com a certeza de sempre: amanha alguem sobe, alguem sofre e todo mundo finge que tinha conviccao.`,
      () =>
        misses
          ? `${misses} teve uma rodada para esquecer, mas a Copa e longa e a tabela adora uma reviravolta. Dorme hoje, recalcula amanha.`
          : `${input.headline} O topo chama atencao, mas a melhor fofoca esta nas posicoes coladas.`
    ];

    return inProgressTemplates[Math.floor(Math.random() * inProgressTemplates.length)]();
  }

  const templates = [
    () =>
      daysUntil !== undefined && daysUntil > 0
        ? `Contagem regressiva ligada: faltam ${daysUntil} dia(s) para a Copa começar. Quem ainda nao entrou no clima da Resenha Cup ta pedindo para virar figurante no proprio bolao.`
        : `${input.headline} A Copa ja entrou no radar e a resenha oficialmente nao tem mais volta.`,
    () =>
      newMembers
        ? `Chegou gente nova na Resenha Cup: ${newMembers}. Ja podem escolher um canto no sofa e preparar o primeiro palpite, porque aqui ate chute torto vira assunto.`
        : `A IAestagiaria passou para lembrar: Copa do Mundo nao espera ninguem. Perfil arrumado, palpite afiado e provocacao em dia, por favor.`,
    () =>
      `${input.headline} ${input.matchSummary ?? "A mesa ja comecou a fazer conta de guardanapo."} Quem bobear agora vai virar pauta da resenha.`,
    () =>
      battle
        ? `${battle}. Esse tipo de distancia pequena e o combustivel oficial de quem abre o app so para secar o vizinho de tabela.`
        : `${input.headline} A briga esta menos sobre liderar bonito e mais sobre nao deixar o pelotao respirar no cangote.`,
    () =>
      bottom
        ? `${bottom}. O fundo da tabela ainda tem saida, mas agora cada pontinho vale aquele drama de final de campeonato.`
        : `${input.headline} Quem esta la embaixo ainda tem estrada, mas precisa parar de tratar palpite como chute no escuro.`,
    () =>
      upcoming
        ? `Proximo alvo da resenha: ${upcoming}. Quem cravar aqui pode mudar a conversa antes que o ranking esfrie.`
        : `${input.headline} A rodada nao acabou e a tabela ja esta fazendo conta com cara de quem vai aprontar.`,
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
