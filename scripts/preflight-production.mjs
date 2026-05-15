import fs from "node:fs";
import path from "node:path";

const ENV_FILE = process.argv[2] ?? ".env";

function readEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo nao encontrado: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
      return [key, value];
    });

  return Object.fromEntries(entries);
}

function isConfigured(value) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  const invalidMarkers = [
    "replace-with-a-long-random-secret",
    "[PROJECT-REF]",
    "[REGION]",
    "[PRISMA_DB_PASSWORD]",
    "[SUPABASE_DB_PASSWORD]",
    "[YOUR-PASSWORD]"
  ];

  return !invalidMarkers.some((marker) => normalized.includes(marker));
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isLocalUrl(value) {
  return /localhost|127\.0\.0\.1/i.test(value);
}

function logSection(title) {
  console.log(`\n${title}`);
}

try {
  const env = readEnvFile(ENV_FILE);
  const errors = [];
  const warnings = [];

  const requiredVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "NEXTAUTH_URL",
    "LAUNCH_ADMIN_EMAIL"
  ];

  for (const key of requiredVars) {
    if (!isConfigured(env[key])) {
      errors.push(`${key} nao esta configurada corretamente.`);
    }
  }

  if (!isConfigured(env.AUTH_GOOGLE_ID) || !isConfigured(env.AUTH_GOOGLE_SECRET)) {
    warnings.push("Google OAuth nao esta completo. O login com Google nao vai aparecer.");
  }

  if (!isConfigured(env.OPENAI_API_KEY)) {
    warnings.push("OPENAI_API_KEY ausente. A IAestagiaria vai operar apenas em modo fallback.");
  }

  if ((isConfigured(env.AUTH_APPLE_ID) && !isConfigured(env.AUTH_APPLE_SECRET)) ||
      (!isConfigured(env.AUTH_APPLE_ID) && isConfigured(env.AUTH_APPLE_SECRET))) {
    errors.push("Apple OAuth esta pela metade. Configure ID e SECRET juntos ou deixe ambos vazios.");
  }

  if (isConfigured(env.AUTH_URL) && !isValidUrl(env.AUTH_URL)) {
    errors.push("AUTH_URL nao e uma URL valida.");
  }

  if (isConfigured(env.NEXTAUTH_URL) && !isValidUrl(env.NEXTAUTH_URL)) {
    errors.push("NEXTAUTH_URL nao e uma URL valida.");
  }

  if (isConfigured(env.AUTH_URL) && isConfigured(env.NEXTAUTH_URL) && env.AUTH_URL !== env.NEXTAUTH_URL) {
    errors.push("AUTH_URL e NEXTAUTH_URL devem apontar para o mesmo dominio final.");
  }

  if (isConfigured(env.AUTH_URL) && isLocalUrl(env.AUTH_URL)) {
    warnings.push("AUTH_URL ainda aponta para ambiente local.");
  }

  if (isConfigured(env.NEXTAUTH_URL) && isLocalUrl(env.NEXTAUTH_URL)) {
    warnings.push("NEXTAUTH_URL ainda aponta para ambiente local.");
  }

  if (isConfigured(env.DATABASE_URL) && !/^postgres(ql)?:\/\//i.test(env.DATABASE_URL)) {
    errors.push("DATABASE_URL nao parece ser uma string Postgres valida.");
  }

  if (isConfigured(env.DIRECT_URL) && !/^postgres(ql)?:\/\//i.test(env.DIRECT_URL)) {
    errors.push("DIRECT_URL nao parece ser uma string Postgres valida.");
  }

  if (isConfigured(env.DIRECT_URL) && /:6543\//.test(env.DIRECT_URL)) {
    warnings.push("DIRECT_URL esta usando a porta 6543. Para Prisma, prefira a conexao direta/5432 quando possivel.");
  }

  logSection("Preflight de producao");
  console.log(`Arquivo analisado: ${path.resolve(ENV_FILE)}`);

  logSection("Resumo");
  console.log(`Erros: ${errors.length}`);
  console.log(`Alertas: ${warnings.length}`);

  if (errors.length) {
    logSection("Erros que bloqueiam deploy");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  }

  if (warnings.length) {
    logSection("Alertas recomendados");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (!errors.length) {
    logSection("Resultado");
    console.log("Ambiente pronto para seguir ao deploy.");
  }

  process.exit(errors.length ? 1 : 0);
} catch (error) {
  console.error("Falha ao executar o preflight.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
