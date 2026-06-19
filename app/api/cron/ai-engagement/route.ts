import { NextResponse } from "next/server";
import { publishDailyWorldCupEngagementPost } from "@/lib/daily-world-cup-engagement";
import { publishKnockoutCountdownPost } from "@/lib/knockout-countdown-engagement";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    return false;
  }

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const [dailyEngagement, knockoutCountdown] = await Promise.all([
    publishDailyWorldCupEngagementPost().catch((error) => ({
      skipped: true,
      reason: "daily_engagement_failed",
      error: error instanceof Error ? error.message : "Falha no giro diario."
    })),
    publishKnockoutCountdownPost().catch((error) => ({
      skipped: true,
      reason: "knockout_countdown_failed",
      error: error instanceof Error ? error.message : "Falha na contagem regressiva."
    }))
  ]);

  return NextResponse.json({
    ok: true,
    summary: {
      dailyEngagement,
      knockoutCountdown
    }
  });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
