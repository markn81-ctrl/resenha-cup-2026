import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function hasConfiguredValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  return ![
    "replace-with-a-long-random-secret",
    "[PROJECT-REF]",
    "[REGION]",
    "[PRISMA_DB_PASSWORD]",
    "[SUPABASE_DB_PASSWORD]",
    "[YOUR-PASSWORD]"
  ].some((placeholder) => normalized.includes(placeholder));
}

function hasValidHttpUrl(value: string | undefined) {
  if (!hasConfiguredValue(value)) {
    return false;
  }

  try {
    const url = new URL(value!);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const checks = {
    database: false,
    auth: {
      secret: hasConfiguredValue(process.env.AUTH_SECRET),
      authUrl: hasValidHttpUrl(process.env.AUTH_URL),
      nextAuthUrl: hasValidHttpUrl(process.env.NEXTAUTH_URL),
      google:
        hasConfiguredValue(process.env.AUTH_GOOGLE_ID) &&
        hasConfiguredValue(process.env.AUTH_GOOGLE_SECRET),
      apple:
        hasConfiguredValue(process.env.AUTH_APPLE_ID) &&
        hasConfiguredValue(process.env.AUTH_APPLE_SECRET)
    },
    ai: {
      configured: hasConfiguredValue(process.env.OPENAI_API_KEY)
    }
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const status =
    checks.database && checks.auth.secret && checks.auth.authUrl && checks.auth.nextAuthUrl
      ? "ok"
      : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
