import bcrypt from "bcryptjs";
import { ApprovalStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION
} from "@/lib/legal";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: parsed.data.email } }),
      prisma.user.findUnique({ where: { username: parsed.data.username } })
    ]);

    if (existingEmail) {
      return NextResponse.json({ error: "Email ja cadastrado." }, { status: 409 });
    }

    if (existingUsername) {
      return NextResponse.json({ error: "Username indisponivel." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const acceptedAt = new Date();

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        email: parsed.data.email,
        passwordHash,
        role: Role.USER,
        approvalStatus: ApprovalStatus.PENDING,
        termsAcceptedAt: acceptedAt,
        termsVersion: LEGAL_TERMS_VERSION,
        privacyAcceptedAt: acceptedAt,
        privacyVersion: LEGAL_PRIVACY_VERSION,
        legalAcceptedIp:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip"),
        legalAcceptedUserAgent: request.headers.get("user-agent")
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "user.registered",
        entityType: "User",
        entityId: user.id,
        payload: {
          email: user.email,
          approvalStatus: user.approvalStatus,
          termsVersion: LEGAL_TERMS_VERSION,
          privacyVersion: LEGAL_PRIVACY_VERSION
        }
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao criar conta." }, { status: 500 });
  }
}
