import { ApprovalStatus, Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const resetSchema = z.object({
  confirmation: z.literal("LIMPAR")
});

function getLaunchAdminEmails() {
  return (process.env.LAUNCH_ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Confirmacao invalida." }, { status: 400 });
  }

  try {
    const launchAdminEmails = getLaunchAdminEmails();
    const adminFilters: Prisma.UserWhereInput[] = [
      { id: session.user.id },
      { role: Role.ADMIN }
    ];

    if (launchAdminEmails.length) {
      adminFilters.push({
        email: {
          in: launchAdminEmails,
          mode: "insensitive"
        }
      });
    }

    const admins = await prisma.user.findMany({
      where: {
        OR: adminFilters
      },
      select: {
        id: true,
        email: true
      }
    });

    const keepUserIds = Array.from(new Set(admins.map((user) => user.id)));
    const keepSummary = admins.map((user) => user.email ?? user.id);

    await prisma.$transaction(async (tx) => {
      await tx.like.deleteMany();
      await tx.comment.deleteMany();
      await tx.feedPost.deleteMany();
      await tx.notification.deleteMany();
      await tx.playerStatus.deleteMany();
      await tx.leaderboard.deleteMany();
      await tx.rivalry.deleteMany();
      await tx.matchResult.deleteMany();
      await tx.prediction.deleteMany();
      await tx.score.deleteMany();
      await tx.auditLog.deleteMany();

      if (keepUserIds.length) {
        await tx.session.deleteMany({
          where: {
            userId: {
              notIn: keepUserIds
            }
          }
        });

        await tx.account.deleteMany({
          where: {
            userId: {
              notIn: keepUserIds
            }
          }
        });

        await tx.user.deleteMany({
          where: {
            id: {
              notIn: keepUserIds
            }
          }
        });

        await tx.user.updateMany({
          where: {
            id: {
              in: keepUserIds
            }
          },
          data: {
            approvalStatus: ApprovalStatus.APPROVED
          }
        });
      }

      await tx.match.updateMany({
        data: {
          status: "SCHEDULED"
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "launch.reset.completed",
          entityType: "System",
          entityId: "launch-reset",
          payload: {
            keptAdmins: keepSummary,
            keptCount: keepUserIds.length,
            source: "admin-panel"
          }
        }
      });
    });

    return NextResponse.json({
      ok: true,
      keptAdmins: keepSummary,
      keptCount: keepUserIds.length
    });
  } catch {
    return NextResponse.json({ error: "Falha ao limpar dados de lancamento." }, { status: 500 });
  }
}
