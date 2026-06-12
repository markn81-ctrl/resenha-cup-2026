import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchOfficialResultPreview } from "@/lib/fifa-results";
import { prisma } from "@/lib/prisma";
import { officialResultFetchSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = officialResultFetchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const officialResult = await fetchOfficialResultPreview(parsed.data.matchId);

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "admin.official_result_fetched",
        entityType: "Match",
        entityId: parsed.data.matchId,
        payload: {
          source: officialResult.source,
          score: officialResult.score,
          scorers: officialResult.scorers,
          cards: officialResult.cards,
          warnings: officialResult.warnings
        }
      }
    });

    return NextResponse.json({
      ok: true,
      officialResult
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar o resultado oficial."
      },
      { status: 422 }
    );
  }
}
