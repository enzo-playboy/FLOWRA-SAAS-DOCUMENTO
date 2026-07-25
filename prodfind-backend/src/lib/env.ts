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
