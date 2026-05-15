import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deriveOutcome } from "@/lib/scoring";
import { ensurePredictionEditable } from "@/lib/locks";
import { prisma } from "@/lib/prisma";
import { predictionInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    return NextResponse.json({ error: "Conta ainda nao aprovada." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = predictionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Palpite invalido." }, { status: 400 });
    }

    const derivedOutcome = deriveOutcome(parsed.data.score);

    if (derivedOutcome !== parsed.data.outcome) {
      return NextResponse.json(
        { error: "Resultado informado nao bate com o placar exato." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: parsed.data.matchId },
      include: {
        homeTeam: {
          include: {
            players: {
              where: { isActive: true }
            }
          }
        },
        awayTeam: {
          include: {
            players: {
              where: { isActive: true }
            }
          }
        },
        predictions: {
          where: { userId: session.user.id },
          include: { score: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: "Jogo nao encontrado." }, { status: 404 });
    }

    ensurePredictionEditable(match.lockAt);

    const scorers = Array.from(
      new Set(parsed.data.scorers.map((value) => value.trim()).filter(Boolean))
    ).slice(0, 2);

    const availableScorers = new Set(
      [...(match.homeTeam?.players ?? []), ...(match.awayTeam?.players ?? [])].map((player) =>
        player.name.trim().toLowerCase()
      )
    );

    if (availableScorers.size && scorers.some((scorer) => !availableScorers.has(scorer.toLowerCase()))) {
      return NextResponse.json(
        { error: "Selecione artilheiros validos da lista do jogo." },
        { status: 400 }
      );
    }

    const existing = match.predictions[0];

    const prediction = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.score.update({
          where: { id: existing.scoreId },
          data: parsed.data.score
        });

        return tx.prediction.update({
          where: { id: existing.id },
          data: {
            outcome: parsed.data.outcome,
            scorers,
            cardsEdge: parsed.data.cardsEdge,
            cardsRange: parsed.data.cardsRange,
            isLockedSnapshot: false
          }
        });
      }

      const score = await tx.score.create({
        data: parsed.data.score
      });

      return tx.prediction.create({
        data: {
          userId: session.user.id,
          matchId: parsed.data.matchId,
          outcome: parsed.data.outcome,
          scoreId: score.id,
          scorers,
          cardsEdge: parsed.data.cardsEdge,
          cardsRange: parsed.data.cardsRange
        }
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: existing ? "prediction.updated" : "prediction.created",
        entityType: "Prediction",
        entityId: prediction.id,
        payload: {
          ...parsed.data,
          scorers
        }
      }
    });

    return NextResponse.json({ ok: true, predictionId: prediction.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao salvar palpite." },
      { status: 500 }
    );
  }
}
