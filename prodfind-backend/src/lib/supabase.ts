import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env";

// Cliente com SERVICE ROLE — SÓ server-side.
// Nunca expor a SERVICE_ROLE_KEY no frontend.
//
// Obs sobre pooler: com supabase-js (HTTP/PostgREST) o pooling é feito pelo
// próprio PostgREST do Supabase, então não precisamos de pgbouncer aqui.
// O pgbouncer (porta 6543 / ?pgbouncer=true) só entra se usarmos um driver
// DB direto (Prisma/Drizzle) — nesse caso, use a connection string do pooler.
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
