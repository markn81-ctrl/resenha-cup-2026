import { ApprovalStatus, FeedPostType, NotificationType, Phase } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";

const KNOCKOUT_COUNTDOWN_ACTION = "knockout_countdown.published";
const COUNTDOWN_MILESTONES = new Set([10, 7, 5, 3, 1, 0]);

function getSaoPauloDateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

function dateKeyToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function getDaysUntilDate(target: Date, now = new Date()) {
  const todayUtc = dateKeyToUtc(getSaoPauloDateKey(now));
  const targetUtc = dateKeyToUtc(getSaoPauloDateKey(target));

  return Math.ceil((targetUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

function formatSaoPauloDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

function buildCountdownContent(args: {
  daysUntilKnockout: number;
  firstMatchLabel: string;
  firstMatchStartsAt: Date;
}) {
  if (args.daysUntilKnockout === 0) {
    return `Pessoal, acabou o aquecimento: hoje comeca o mata-mata da Resenha Cup.\n\nA fase de grupos serviu para calibrar palpite, testar coragem e fingir que todo erro fazia parte de uma estrategia maior.\n\nAgora a conversa muda: o Ranking Geral continua contando a campanha completa, mas o Ranking Mata-mata e a disputa que vale o pote.\n\nPrimeiro jogo da virada de chave: ${args.firstMatchLabel}, em ${formatSaoPauloDateTime(args.firstMatchStartsAt)}.\n\nResumo da IAestagiaria: daqui pra frente cada palpite pesa mais, cada multiplicador cutuca mais e cada cravada pode virar assunto com cifrao no olhar.`;
  }

  const dayLabel = args.daysUntilKnockout === 1 ? "1 dia" : `${args.daysUntilKnockout} dias`;

  return `Contagem regressiva ligada: faltam ${dayLabel} para o mata-mata da Resenha Cup.\n\nA fase de grupos ainda vale ranking, moral e provocacao, mas todo mundo ja sabe que ela tambem esta servindo como aquecimento para a disputa que vai valer o pote.\n\nQuando o mata-mata comecar, o Ranking Geral segue mostrando a campanha completa. Mas o Ranking Mata-mata passa a ser a briga separada pelo R$.\n\nPrimeiro jogo da virada de chave: ${args.firstMatchLabel}, em ${formatSaoPauloDateTime(args.firstMatchStartsAt)}.\n\nResumo da IAestagiaria: aproveita para estudar os adversarios agora, porque logo mais palpite errado nao vai doer so no orgulho.`;
}

export async function publishKnockoutCountdownPost(now = new Date()) {
  const firstKnockoutMatch = await prisma.match.findFirst({
    where: {
      phase: {
        not: Phase.GROUP_STAGE
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: [{ startsAt: "asc" }, { number: "asc" }]
  });

  if (!firstKnockoutMatch) {
    return {
      skipped: true,
      reason: "knockout_match_not_found"
    };
  }

  const daysUntilKnockout = getDaysUntilDate(firstKnockoutMatch.startsAt, now);

  if (daysUntilKnockout < 0) {
    return {
      skipped: true,
      reason: "knockout_already_started",
      daysUntilKnockout
    };
  }

  if (!COUNTDOWN_MILESTONES.has(daysUntilKnockout)) {
    return {
      skipped: true,
      reason: "not_countdown_milestone",
      daysUntilKnockout
    };
  }

  const dateKey = getSaoPauloDateKey(now);
  const entityId = `${dateKey}:${daysUntilKnockout}`;
  const alreadyPublished = await prisma.auditLog.findFirst({
    where: {
      action: KNOCKOUT_COUNTDOWN_ACTION,
      entityType: "FeedPost",
      entityId
    },
    select: {
      id: true
    }
  });

  if (alreadyPublished) {
    return {
      skipped: true,
      reason: "already_published_for_milestone",
      dateKey,
      daysUntilKnockout
    };
  }

  const approvedUsers = await prisma.user.findMany({
    where: { approvalStatus: ApprovalStatus.APPROVED },
    select: { id: true }
  });
  const firstMatchLabel = `Jogo ${firstKnockoutMatch.number}: ${
    firstKnockoutMatch.homeTeam?.name ?? firstKnockoutMatch.homePlaceholder ?? "Time A"
  } x ${firstKnockoutMatch.awayTeam?.name ?? firstKnockoutMatch.awayPlaceholder ?? "Time B"}`;
  const title =
    daysUntilKnockout === 0
      ? "IAestagiaria: hoje comeca o mata-mata"
      : `IAestagiaria: faltam ${daysUntilKnockout} dias para o mata-mata`;
  const content = buildCountdownContent({
    daysUntilKnockout,
    firstMatchLabel,
    firstMatchStartsAt: firstKnockoutMatch.startsAt
  });
  const notificationBody =
    daysUntilKnockout === 0
      ? "O mata-mata da Resenha Cup comeca hoje. O pote entrou no chat."
      : `Faltam ${daysUntilKnockout} dia(s) para o Ranking Mata-mata valer o pote.`;

  const post = await prisma.$transaction(async (tx) => {
    const createdPost = await tx.feedPost.create({
      data: {
        type: FeedPostType.AI_COMMENTARY,
        title,
        content,
        metadata: {
          source: "knockout_countdown",
          dateKey,
          daysUntilKnockout,
          firstMatchId: firstKnockoutMatch.id,
          firstMatchNumber: firstKnockoutMatch.number,
          firstMatchStartsAt: firstKnockoutMatch.startsAt.toISOString(),
          firstMatchLabel
        }
      }
    });

    await tx.auditLog.create({
      data: {
        action: KNOCKOUT_COUNTDOWN_ACTION,
        entityType: "FeedPost",
        entityId,
        payload: {
          postId: createdPost.id,
          dateKey,
          daysUntilKnockout,
          firstMatchId: firstKnockoutMatch.id,
          firstMatchNumber: firstKnockoutMatch.number
        }
      }
    });

    if (approvedUsers.length) {
      await tx.notification.createMany({
        data: approvedUsers.map((user) => ({
          userId: user.id,
          type: NotificationType.AI_MENTION,
          title,
          body: notificationBody,
          href: "/resenha",
          metadata: {
            source: "knockout_countdown",
            postId: createdPost.id,
            dateKey,
            daysUntilKnockout
          }
        }))
      });
    }

    return createdPost;
  });

  await sendPushToUsers(
    approvedUsers.map((user) => user.id),
    {
      title,
      body: notificationBody,
      url: "/resenha"
    }
  );

  return {
    skipped: false,
    dateKey,
    postId: post.id,
    daysUntilKnockout,
    firstMatchNumber: firstKnockoutMatch.number
  };
}
