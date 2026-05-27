import { ApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMatchPredictionData } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (session.user.approvalStatus !== ApprovalStatus.APPROVED) {
    return NextResponse.json({ error: "Conta ainda nao aprovada." }, { status: 403 });
  }

  const match = await getMatchPredictionData(params.matchId, session.user.id);

  if (!match) {
    return NextResponse.json({ error: "Jogo nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(match);
}
