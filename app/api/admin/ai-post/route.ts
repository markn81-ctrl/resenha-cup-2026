import { ApprovalStatus, FeedPostType, LeaderboardScope, NotificationType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiCommentary } from "@/lib/ai";
import { buildAutomaticCommentary } from "@/lib/ai-context";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";

const schema = z.object({
  scope: z.nativeEnum(LeaderboardScope).optional()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const scope = parsed.data.scope ?? LeaderboardScope.OVERALL;
    const commentary = await buildAutomaticCommentary(scope);
    const content = await generateAiCommentary(commentary);
    const approvedUsers = await prisma.user.findMany({
      where: { approvalStatus: ApprovalStatus.APPROVED },
      select: { id: true }
    });
    const notificationTitle = "IAestagiaria publicou no feed";
    const notificationBody = "Tem resenha nova da IAestagiaria esperando voce.";
    const notificationHref = "/resenha";

    const post = await prisma.$transaction(async (tx) => {
      const createdPost = await tx.feedPost.create({
        data: {
          type: FeedPostType.AI_COMMENTARY,
          content,
          metadata: commentary
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
              source: "admin_ai_post",
              postId: createdPost.id,
              scope
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

    return NextResponse.json({
      ok: true,
      id: post.id,
      scope,
      preview: post.content,
      notifiedUsers: approvedUsers.length,
      push
    });
  } catch {
    return NextResponse.json({ error: "Falha ao gerar post da IA." }, { status: 500 });
  }
}
