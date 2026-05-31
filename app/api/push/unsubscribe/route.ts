import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    return NextResponse.json({ error: "Conta ainda nao aprovada." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { endpoint?: unknown };

    if (typeof body.endpoint !== "string" || !body.endpoint) {
      return NextResponse.json({ error: "Endpoint push invalido." }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: body.endpoint
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao desativar push." }, { status: 500 });
  }
}
