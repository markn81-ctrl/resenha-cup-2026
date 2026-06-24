import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applyKnockoutMatchups,
  fetchKnockoutMatchupPreview
} from "@/lib/fifa-knockout-matchups";
import { auth } from "@/lib/auth";

const schema = z.object({
  action: z.enum(["preview", "apply"]).default("preview")
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

    if (parsed.data.action === "apply") {
      const result = await applyKnockoutMatchups(session.user.id);
      return NextResponse.json({
        ok: true,
        ...result
      });
    }

    const preview = await fetchKnockoutMatchupPreview();
    return NextResponse.json({
      ok: true,
      preview
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar os confrontos do mata-mata."
      },
      { status: 422 }
    );
  }
}
