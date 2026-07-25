import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { trendingQuerySchema } from "@/lib/validate";
import { getTrendingByCategory, type TrendingProduct } from "@/lib/ml-highlights";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_TTL = 60 * 10; // 10 min
// Categoria testada que o /highlights resolve como contexto (fallback).
const DEFAULT_CATEGORY = "MLB432825";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit(`trending:${ip}`, 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "limite de requisições atingido, tente depois" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const category =
    req.nextUrl.searchParams.get("category") ?? DEFAULT_CATEGORY;
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? "12");
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : 12, 1),
    30
  );

  const parsed = trendingQuerySchema.safeParse({ category });
  if (!parsed.success) {
    return NextResponse.json({ error: "categoria inválida" }, { status: 400 });
  }

  const cacheKey = `trending:${parsed.data.category}:${limit}`;
  const cached = await cacheGet<TrendingProduct[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ items: cached, cached: true });
  }

  try {
    const items = await getTrendingByCategory(parsed.data.category, limit);
    await cacheSet(cacheKey, items, CACHE_TTL);
    return NextResponse.json({ items, cached: false });
  } catch {
    return NextResponse.json(
      { error: "falha ao buscar no Mercado Livre" },
      { status: 502 }
    );
  }
}
