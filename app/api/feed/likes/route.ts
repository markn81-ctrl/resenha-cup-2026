import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const likeSchema = z.object({
  postId: z.string().cuid().optional(),
  commentId: z.string().cuid().optional()
});

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
    const parsed = likeSchema.safeParse(body);

    if (!parsed.success || (!parsed.data.postId && !parsed.data.commentId)) {
      return NextResponse.json({ error: "Like invalido." }, { status: 400 });
    }

    const existing = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        postId: parsed.data.postId ?? null,
        commentId: parsed.data.commentId ?? null
      }
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ ok: true, liked: false });
    }

    await prisma.like.create({
      data: {
        userId: session.user.id,
        postId: parsed.data.postId,
        commentId: parsed.data.commentId
      }
    });

    return NextResponse.json({ ok: true, liked: true });
  } catch {
    return NextResponse.json({ error: "Falha ao curtir." }, { status: 500 });
  }
}
