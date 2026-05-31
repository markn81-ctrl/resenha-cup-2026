import { ApprovalStatus, NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { commentSchema } from "@/lib/validation";

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
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Comentario invalido." }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        authorId: session.user.id,
        postId: parsed.data.postId,
        parentId: parsed.data.parentId,
        content: parsed.data.content
      },
      include: {
        post: true
      }
    });

    if (comment.post.authorId && comment.post.authorId !== session.user.id) {
      const notification = await prisma.notification.create({
        data: {
          userId: comment.post.authorId,
          type: NotificationType.COMMENT_RECEIVED,
          title: "Novo comentario no seu post",
          body: `${session.user.name ?? "Alguem"} respondeu no feed.`,
          href: "/resenha"
        }
      });

      await sendPushToUser(comment.post.authorId, {
        title: notification.title,
        body: notification.body,
        url: notification.href ?? "/resenha"
      });
    }

    return NextResponse.json({ ok: true, id: comment.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao comentar." }, { status: 500 });
  }
}
