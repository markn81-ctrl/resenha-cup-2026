import { ApprovalStatus, NotificationType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const approvalSchema = z.object({
  userId: z.string().cuid(),
  approvalStatus: z.nativeEnum(ApprovalStatus)
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = approvalSchema.safeParse(body);

    if (!parsed.success || parsed.data.approvalStatus === ApprovalStatus.PENDING) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        approvalStatus: parsed.data.approvalStatus
      }
    });

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type:
          parsed.data.approvalStatus === ApprovalStatus.APPROVED
            ? NotificationType.ACCESS_APPROVED
            : NotificationType.ACCESS_REJECTED,
        title:
          parsed.data.approvalStatus === ApprovalStatus.APPROVED
            ? "Acesso liberado"
            : "Acesso recusado",
        body:
          parsed.data.approvalStatus === ApprovalStatus.APPROVED
            ? "Sua conta foi aprovada. A mesa te espera."
            : "O admin recusou seu acesso a esta liga privada.",
        href: parsed.data.approvalStatus === ApprovalStatus.APPROVED ? "/dashboard" : "/"
      }
    });

    await sendPushToUser(user.id, {
      title: notification.title,
      body: notification.body,
      url: notification.href ?? "/"
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "user.approval.updated",
        entityType: "User",
        entityId: user.id,
        payload: parsed.data
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar aprovacao." }, { status: 500 });
  }
}
