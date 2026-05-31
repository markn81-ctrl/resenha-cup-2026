import { ApprovalStatus } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PushSubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function parseSubscription(body: PushSubscriptionBody) {
  if (
    typeof body.endpoint !== "string" ||
    !body.endpoint ||
    typeof body.keys?.p256dh !== "string" ||
    !body.keys.p256dh ||
    typeof body.keys?.auth !== "string" ||
    !body.keys.auth
  ) {
    return null;
  }

  return {
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth
  };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    return NextResponse.json({ error: "Conta ainda nao aprovada." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as PushSubscriptionBody;
    const subscription = parseSubscription(body);

    if (!subscription) {
      return NextResponse.json({ error: "Assinatura push invalida." }, { status: 400 });
    }

    const headerList = headers();
    const userAgent = headerList.get("user-agent");

    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint
      },
      update: {
        userId: session.user.id,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        userAgent
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        userAgent
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao ativar push." }, { status: 500 });
  }
}
