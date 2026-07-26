import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { limits, mlGuard, type RouteKey } from "./ratelimit";

/**
 * Helpers de rate limit (RFC-002 §7, Conselho 25/07).
 * - getIdentifier: user_id (auth) ou composite hash (anon). NUNCA IP puro (CGNAT BR).
 * - enforceRateLimit: limite de UX por rota. Fail-open (Redis down NÃO trava o usuário).
 * - enforceMlGuard: guarda global da cota ML. Bloqueia (503) se estourar.
 * - isPreflight: CORS OPTIONS não deve consumir bucket (negociar preflight não queima quota).
 */

export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `u:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "no-ua";
  const device = req.cookies.get("did")?.value || "no-device";
  const composite = createHash("sha256")
    .update(`${ip}|${ua}|${device}`)
    .digest("hex")
    .slice(0, 16);
  return `anon:${composite}`;
}

export async function enforceRateLimit(
  route: RouteKey,
  req: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  const pair = limits[route];
  const limiter = userId ? pair.auth : pair.anon;
  if (!limiter) return null; // redis null => sem limite (dev/local)
  const identifier = getIdentifier(req, userId);
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    if (success) return null;
    return rateLimited(limit, remaining, reset);
  } catch {
    return null; // fail-open: não trava o usuário se o Redis der erro
  }
}

export async function enforceMlGuard(
  identifier = "ml:app-token"
): Promise<NextResponse | null> {
  if (!mlGuard) return null;
  try {
    const { success, reset } = await mlGuard.limit(identifier);
    if (success) return null;
    return NextResponse.json(
      { error: "serviço temporariamente indisponível (quota ML)" },
      {
        status: 503,
        headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
      }
    );
  } catch {
    return null; // fail-open: cache cobre em caso de erro de redis
  }
}

export function isPreflight(req: NextRequest): boolean {
  return req.method === "OPTIONS";
}

function rateLimited(limit: number, remaining: number, reset: number): NextResponse {
  return NextResponse.json(
    { error: "rate_limited", message: "Muitas requisições. Tente em instantes." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}
