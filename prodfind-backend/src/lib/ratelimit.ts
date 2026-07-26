import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Rate limit — validado pelo Conselho de LLMs (25/07). RFC-002 §7.
 * - Store: Redis (in-memory, compartilhado) — correto p/ serverless (memória local seria por-instância).
 * - Identificador: user_id (auth) / composite hash (anon). NUNCA IP puro (CGNAT BR => falso positivo em massa).
 * - Fail-open: timeout 800ms libera se Redis lento/indisponível (site não cai).
 * - Valores conservadores + overridable via env (não hardcoded; tunar com dados em 2 semanas).
 */

export type RouteKey =
  | "search"
  | "trending"
  | "leads"
  | "auth"
  | "savedProducts"
  | "alerts"
  | "checkout";

function envNum(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Token bucket. timeout => fail-open embutido (sucesso se o Redis não responder a tempo).
function bucket(tokens: number, capacity = tokens): Ratelimit | null {
  if (!redis) return null; // redis não configurado (dev) => sem limite
  return new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(tokens, "60 s", capacity),
    analytics: true,
    prefix: "rl",
    timeout: 800,
  });
}

export type LimiterPair = { anon: Ratelimit | null; auth: Ratelimit | null };

// Defaults conservadores (RFC-002 §7). Override via env (ex.: RL_SEARCH_AUTH=30).
export const limits: Record<RouteKey, LimiterPair> = {
  search: { anon: bucket(envNum("RL_SEARCH_ANON", 5)), auth: bucket(envNum("RL_SEARCH_AUTH", 20), 30) },
  trending: { anon: bucket(envNum("RL_TRENDING_ANON", 10)), auth: bucket(envNum("RL_TRENDING_AUTH", 40), 60) },
  leads: { anon: bucket(envNum("RL_LEADS_ANON", 3)), auth: bucket(envNum("RL_LEADS_AUTH", 3)) },
  auth: { anon: bucket(envNum("RL_AUTH_ANON", 20)), auth: bucket(envNum("RL_AUTH_AUTH", 20)) },
  savedProducts: { anon: bucket(envNum("RL_SAVED_ANON", 20)), auth: bucket(envNum("RL_SAVED_AUTH", 60)) },
  alerts: { anon: bucket(envNum("RL_ALERTS_ANON", 20)), auth: bucket(envNum("RL_ALERTS_AUTH", 60)) },
  checkout: { anon: bucket(envNum("RL_CHECKOUT_ANON", 3)), auth: bucket(envNum("RL_CHECKOUT_AUTH", 3)) },
};

/**
 * Guarda GLOBAL da cota do Mercado Livre (app token compartilhado).
 * É o que protege a margem de verdade — o cache (TTL 5–60min) é a 1ª linha de defesa.
 * FAIL-CLOSED em operação normal (bloqueia 503 se estourar). Redis down => fail-open (cache cobre).
 * ⚠️ BLOQUEANTE (RFC-002 §13): medir o limite real do ML (carga até 429) antes de fixar RL_ML_GLOBAL.
 */
export const mlGuard: Ratelimit | null = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(
        envNum("RL_ML_GLOBAL", 100),
        "60 s",
        envNum("RL_ML_GLOBAL", 100)
      ),
      analytics: true,
      prefix: "rl:ml",
      timeout: 800,
    })
  : null;
