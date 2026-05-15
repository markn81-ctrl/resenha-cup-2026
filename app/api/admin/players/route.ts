import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminPlayerUpdateSchema } from "@/lib/validation";

function deriveShortName(name: string) {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1]}`.slice(0, 24);
  }

  return trimmed.slice(0, 24);
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = adminPlayerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const name = parsed.data.name.trim();
    const shortName = deriveShortName(name);

    const player = await prisma.player.update({
      where: { id: parsed.data.playerId },
      data: {
        name,
        shortName,
        isOfficial: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "admin.player.updated",
        entityType: "Player",
        entityId: player.id,
        payload: {
          name,
          shortName
        }
      }
    });

    return NextResponse.json({
      ok: true,
      player: {
        id: player.id,
        name: player.name,
        shortName: player.shortName
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar jogador." },
      { status: 500 }
    );
  }
}
