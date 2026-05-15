import { LeaderboardScope, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publishAiCommentary } from "@/lib/ai";
import { buildAutomaticCommentary } from "@/lib/ai-context";
import { auth } from "@/lib/auth";

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
    const post = await publishAiCommentary(commentary);

    return NextResponse.json({
      ok: true,
      id: post.id,
      scope,
      preview: post.content
    });
  } catch {
    return NextResponse.json({ error: "Falha ao gerar post da IA." }, { status: 500 });
  }
}
