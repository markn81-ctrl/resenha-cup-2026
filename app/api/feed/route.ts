import { ApprovalStatus, FeedPostType } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFeedData } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  const posts = await getFeedData(session?.user?.id);
  return NextResponse.json(posts);
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
    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Conteudo invalido." }, { status: 400 });
    }

    const post = await prisma.feedPost.create({
      data: {
        type: FeedPostType.USER_POST,
        title: parsed.data.title,
        content: parsed.data.content,
        authorId: session.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "feed.post.created",
        entityType: "FeedPost",
        entityId: post.id
      }
    });

    return NextResponse.json({ ok: true, id: post.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao publicar." }, { status: 500 });
  }
}
