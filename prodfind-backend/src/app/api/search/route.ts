import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, enforceMlGuard } from "@/lib/withRateLimit";
import { searchQuerySchema } from "@/lib/validate";
import { mlSearch, type MLItem } from "@/lib/ml";
import { cacheGet, cacheSet } from "@/lib/cache";
import { calcMargin } from "@/lib/margin";

const CACHE_TTL = 60 * 10; // 10 min

type EnrichedItem = MLItem & {
  cost: number;
  imposto_importacao: number;
  icms: number;
  taxa_correios: number;
  custo_total: number;
  margem_liquida: number;
  margem_pct: number;
};

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  // rate limit (identificador composite anon; passar userId quando sessão estiver wired)
  const blocked = await enforceRateLimit("search", req);
  if (blocked) return blocked;

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const parsed = searchQuerySchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({ error: "termo de busca inválido" }, { status: 400 });
  }

  // 1) tenta o cache (Redis) — não bate no ML nem no Supabase
  const cacheKey = `search:${parsed.data.q.toLowerCase()}`;
  const cached = await cacheGet<EnrichedItem[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ items: cached, cached: true });
  }

  // 2) busca no Mercado Livre e enriquece com margem/imposto BR
  const mlBlocked = await enforceMlGuard();
  if (mlBlocked) return mlBlocked;
  try {
    const items = await mlSearch(parsed.data.q);
    // MVP: custo placeholder = 40% do preço (ajustar com CJ/AliExpress depois)
    const enriched: EnrichedItem[] = items.map((it) => {
      const cost = Math.round(it.price * 0.4 * 100) / 100;
      const m = calcMargin({ price: it.price, cost });
      return { ...it, cost, ...m };
    });
    await cacheSet(cacheKey, enriched, CACHE_TTL);
    return NextResponse.json({ items: enriched, cached: false });
  } catch {
    return NextResponse.json(
      { error: "falha ao buscar no Mercado Livre" },
      { status: 502 }
    );
  }
}
