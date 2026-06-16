import {
  ApprovalStatus,
  FeedPostType,
  LeaderboardScope,
  NotificationType,
  type CardsEdge,
  type CardsRange,
  type MatchResult,
  type Phase,
  type Prediction,
  type PredictionOutcome,
  type Score
} from "@prisma/client";
import { generateAiCommentary } from "@/lib/ai";
import { buildAutomaticCommentary } from "@/lib/ai-context";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { calculatePredictionScore } from "@/lib/scoring";

const RESULT_AI_ACTION = "ai_result_commentary.published";

type ScoreWithScore = Pick<Prediction, "outcome" | "cardsEdge" | "cardsRange" | "scorers"> & {
  score: Pick<Score, "home" | "away">;
};

type ResultWithScore = Pick<MatchResult, "outcome" | "cardsEdge" | "cardsRange" | "scorers"> & {
  score: Pick<Score, "home" | "away">;
};

function getSaoPauloDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

function matchTitle(match: {
  number: number;
  homeTeam?: { name: string } | null;
  awayTeam?: { name: string } | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? "Time A";
  const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B";

  return `Jogo ${match.number}: ${homeName} x ${awayName}`;
}

export async function publishResultFinalizedAiPost(matchId: string, actorId?: string | null) {
  const alreadyPublished = await prisma.auditLog.findFirst({
    where: {
      action: RESULT_AI_ACTION,
      entityType: "Match",
      entityId: matchId
    },
    select: { id: true }
  });

  if (alreadyPublished) {
    return {
      skipped: true,
      reason: "already_published_for_match"
    };
  }

  const [match, approvedUsers, baseCommentary] = await Promise.all([
    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: {
          include: { score: true }
        },
        predictions: {
          include: {
            user: true,
            score: true
          }
        }
      }
    }),
    prisma.user.findMany({
      where: { approvalStatus: ApprovalStatus.APPROVED },
      select: { id: true }
    }),
    buildAutomaticCommentary(LeaderboardScope.OVERALL)
  ]);

  if (!match?.result) {
    return {
      skipped: true,
      reason: "match_without_result"
    };
  }

  const title = matchTitle(match);
  const resultLine = `${title} terminou ${match.result.score.home} x ${match.result.score.away}`;
  const evaluated = match.predictions
    .map((prediction) => {
      const breakdown = calculatePredictionScore({
        prediction: {
          outcome: prediction.outcome as PredictionOutcome,
          cardsEdge: prediction.cardsEdge as CardsEdge,
          cardsRange: prediction.cardsRange as CardsRange,
          scorers: prediction.scorers,
          score: prediction.score
        } satisfies ScoreWithScore,
        result: {
          outcome: match.result!.outcome as PredictionOutcome,
          cardsEdge: match.result!.cardsEdge as CardsEdge,
          cardsRange: match.result!.cardsRange as CardsRange,
          scorers: match.result!.scorers,
          score: match.result!.score
        } satisfies ResultWithScore,
        phase: match.phase as Phase
      });

      return {
        name: prediction.user.name ?? prediction.user.username ?? "Participante",
        points: prediction.points,
        exactHit: breakdown.exactHit
      };
    })
    .sort((a, b) => b.points - a.points);
  const bestPredictions = evaluated
    .slice(0, 3)
    .map((prediction) => `${prediction.name} fez ${prediction.points} pts no ${title}`);
  const exactHits = evaluated
    .filter((prediction) => prediction.exactHit)
    .map((prediction) => prediction.name)
    .slice(0, 5);

  const commentary = {
    ...baseCommentary,
    headline: `Resultado aprovado: ${resultLine}`,
    focus: "resultado recem-aprovado e impacto no ranking",
    matchResults: [
      resultLine,
      ...(baseCommentary.matchResults ?? []).filter((item) => item !== resultLine)
    ].slice(0, 5),
    currentMatches: [
      `${resultLine}; ${match.predictions.length} palpite(s) pontuado(s) e ranking recalculado`,
      ...(baseCommentary.currentMatches ?? [])
    ].slice(0, 6),
    hotStreaks: bestPredictions.length ? bestPredictions : baseCommentary.hotStreaks,
    exactScoreHits: exactHits.length ? exactHits : baseCommentary.exactScoreHits,
    timeContext: {
      localDate: getSaoPauloDateKey(),
      daysUntilWorldCup: 0,
      openingMatchDate: "2026-06-11",
      tournamentStatus: "in_progress" as const
    }
  };
  const content = await generateAiCommentary(commentary);
  const notificationTitle = "IAestagiaria reagiu ao resultado";
  const notificationBody = `${title} ja pontuou e tem resenha nova no feed.`;
  const notificationHref = "/resenha";

  const post = await prisma.$transaction(async (tx) => {
    const createdPost = await tx.feedPost.create({
      data: {
        type: FeedPostType.AI_COMMENTARY,
        matchId: match.id,
        title: "IAestagiaria reagiu ao resultado",
        content,
        metadata: {
          source: "match_result_finalized",
          matchId: match.id,
          matchNumber: match.number,
          commentary
        }
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: RESULT_AI_ACTION,
        entityType: "Match",
        entityId: match.id,
        payload: {
          postId: createdPost.id,
          matchNumber: match.number,
          predictionCount: match.predictions.length
        }
      }
    });

    if (approvedUsers.length) {
      await tx.notification.createMany({
        data: approvedUsers.map((user) => ({
          userId: user.id,
          type: NotificationType.AI_MENTION,
          title: notificationTitle,
          body: notificationBody,
          href: notificationHref,
          metadata: {
            source: "match_result_finalized",
            postId: createdPost.id,
            matchId: match.id
          }
        }))
      });
    }

    return createdPost;
  });

  const push = await sendPushToUsers(
    approvedUsers.map((user) => user.id),
    {
      title: notificationTitle,
      body: notificationBody,
      url: notificationHref
    }
  );

  return {
    skipped: false,
    postId: post.id,
    notifiedUsers: approvedUsers.length,
    push
  };
}
