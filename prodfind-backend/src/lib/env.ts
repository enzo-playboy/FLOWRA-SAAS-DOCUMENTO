import { readFileSync } from "fs";
import { join } from "path";

// Carrega .env / .env.local explicitamente (além do auto-load do Next) para
// garantir que as credenciais do ML estejam disponíveis em QUALQUER runtime
// (Next dev, node script, serverless). Só preenche o que estiver ausente.
function loadEnvFile(p: string) {
  try {
    const raw = readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    // arquivo ausente — ignora
  }
}
const __root = process.cwd();
loadEnvFile(join(__root, ".env"));
loadEnvFile(join(__root, ".env.local"));

// Leitura segura de env vars. Nunca quebra o build se faltar algo —
// quem usa verifica o flag (isSupabaseConfigured / isRedisConfigured).

export const env = {
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  redisToken: process.env.REDIS_TOKEN ?? "",
  mlAppId: process.env.ML_APP_ID ?? "",
  mlAppSecret: process.env.ML_APP_SECRET ?? "",
  mlUserToken: process.env.ML_USER_TOKEN ?? "",
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey
);
export const isRedisConfigured = Boolean(env.redisUrl && env.redisToken);
