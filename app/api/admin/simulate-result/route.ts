import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { simulateMatchResult } from "@/lib/result-simulator";
import { prisma } from "@/lib/prisma";
import { resultSimulationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = resultSimulationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const simulation = await simulateMatchResult(parsed.data);

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "admin.result_simulation",
        entityType: "Match",
        entityId: parsed.data.matchId,
        payload: parsed.data
      }
    });

    return NextResponse.json({
      ok: true,
      simulation
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao simular resultado." },
      { status: 500 }
    );
  }
}
