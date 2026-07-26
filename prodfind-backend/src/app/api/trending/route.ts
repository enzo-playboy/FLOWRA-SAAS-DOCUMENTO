import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, enforceMlGuard } from "@/lib/withRateLimit";
import { trendingQuerySchema } from "@/lib/validate";
import { getTrendingByCategory, type TrendingProduct } from "@/lib/ml-highlights";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getSupplierLinks, estimateSupplierPrice } from "@/lib/suppliers";
import { calculateMargin } from "@/lib/margin";

const CACHE_TTL = 60 * 10; // 10 min
// Categoria testada que o /highlights resolve como contexto (fallback).
const DEFAULT_CATEGORY = "MLB432825";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const blocked = await enforceRateLimit("trending", req);
  if (blocked) return blocked;

  const category =
    req.nextUrl.searchParams.get("category") ?? DEFAULT_CATEGORY;
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? "12");
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : 12, 1),
    30
  );

  // strings vazias viram undefined p/ não ativarem coerção indesejada
  const str = (k: string) => {
    const v = req.nextUrl.searchParams.get(k);
    return v != null && v.trim() !== "" ? v.trim() : undefined;
  };

  const parsed = trendingQuerySchema.safeParse({
    category,
    minPrice: str("minPrice"),
    maxPrice: str("maxPrice"),
    sellerId: str("sellerId"),
    minPosition: str("minPosition"),
    q: str("q"),
    sort: str("sort"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "parâmetros inválidos", detail: parsed.error.issues },
      { status: 400 }
    );
  }

  const f = parsed.data;
  const cacheKey = `trending:${f.category}:${f.minPrice ?? ""}:${f.maxPrice ?? ""}:${f.sellerId ?? ""}:${f.minPosition ?? ""}:${f.q ?? ""}:${f.sort ?? ""}:${limit}`;
  const cached = await cacheGet<TrendingProduct[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ items: cached, cached: true });
  }

  const mlBlocked = await enforceMlGuard();
  if (mlBlocked) return mlBlocked;
  try {
    const items = await getTrendingByCategory(f.category, {
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      sellerId: f.sellerId,
      minPosition: f.minPosition,
      q: f.q,
      sort: f.sort,
      limit,
    });

    // Enriquece cada produto com links de fornecedores e margem estimada
    const enriched = items.map((item) => {
      const supplierLinks = getSupplierLinks(item.name);
      const supplierEstimate = estimateSupplierPrice(item.price, item.domain_id);
      const margin = calculateMargin(
        item.price,
        supplierEstimate.min, // usa estimativa mínima (melhor caso)
        item.domain_id
      );

      return {
        ...item,
        suppliers: supplierLinks,
        supplierPriceEstimate: supplierEstimate,
        margin,
      };
    });

    await cacheSet(cacheKey, enriched, CACHE_TTL);
    return NextResponse.json({ items: enriched, cached: false });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "falha ao buscar no Mercado Livre",
        detail: String(e?.message || e),
        cause: String(e?.cause?.message || e?.cause || ""),
      },
      { status: 502 }
    );
  }
}
