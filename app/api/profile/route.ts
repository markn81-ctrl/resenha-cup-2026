import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados de perfil invalidos." }, { status: 400 });
    }

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: parsed.data.username,
        NOT: {
          id: session.user.id
        }
      }
    });

    if (existingUsername) {
      return NextResponse.json({ error: "Esse username ja esta em uso." }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        bio: parsed.data.bio || null,
        image: parsed.data.image || null
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "profile.updated",
        entityType: "User",
        entityId: user.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar perfil." }, { status: 500 });
  }
}
