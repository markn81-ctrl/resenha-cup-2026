import { LeaderboardScope, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { publishAiCommentary } from "@/lib/ai";

const commentarySchema = z.object({
  scope: z.nativeEnum(LeaderboardScope),
  headline: z.string().min(2),
  top3: z.array(z.string()).max(5).optional(),
  biggestRise: z.string().optional().nullable(),
  biggestFall: z.string().optional().nullable(),
  exactScoreHits: z.array(z.string()).optional(),
  totalMisses: z.array(z.string()).optional(),
  streak: z.record(z.number().int().min(0)).optional(),
  rankingChanges: z.array(z.string()).default([]),
  hotStreaks: z.array(z.string()).default([]),
  coldStreaks: z.array(z.string()).default([]),
  currentRanking: z
    .array(
      z.object({
        name: z.string(),
        position: z.number().int().min(1),
        points: z.number()
      })
    )
    .optional(),
  matchResults: z.array(z.string()).optional(),
  matchSummary: z.string().optional()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = commentarySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const post = await publishAiCommentary(parsed.data);
    return NextResponse.json({ ok: true, id: post.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao publicar comentario da IA." }, { status: 500 });
  }
}
