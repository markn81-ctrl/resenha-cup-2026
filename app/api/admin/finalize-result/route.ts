import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { finalizeMatchResult } from "@/lib/result-finalization";
import { resultSimulationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = resultSimulationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
    }

    const result = await finalizeMatchResult(parsed.data, session.user.id);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao finalizar resultado." },
      { status: 500 }
    );
  }
}
