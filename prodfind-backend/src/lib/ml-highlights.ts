// Pipeline de "produtos mais vendidos por categoria" do Mercado Livre.
//
// VALIDADO 24/07 (Cuiabá/Claro, COM token user-token):
//   /highlights/MLB/category/{cat}  -> ranking oficial (id + position) [EXIGE token]
//   /products/{id}                  -> name, pictures, domain_id        [EXIGE token]
//   /products/{id}/items            -> price, seller_id, item_id        [EXIGE token]
// User-Agent obrigatório (ML barra request sem UA como bot).
//
// Auth: tenta app-token (client_credentials, estável/renovável) e cai no
// ML_USER_TOKEN (user-token salvo no env) se o app-token falhar.
// sold_quantity (vendas exatas) fica bloqueado no user-token; usamos
// `position` do highlights como proxy de "o que vende mais".

import { env } from "./env";
import { appendFileSync } from "fs";
const dlog = (m: string) => { try { appendFileSync("D:/saas flowra/prodfind-backend/ml-debug.log", m + "\n"); } catch {} };

const UA = "ProdFind/1.0 (+https://prodfind.com.br)";
const API = "https://api.mercadolivre.com";

type TokenCache = { token: string; expiresAt: number } | null;
let cachedAppToken: TokenCache = null;

async function getAppToken(): Promise<string | null> {
  if (!env.mlAppId || !env.mlAppSecret) return null;
  if (cachedAppToken && cachedAppToken.expiresAt > Date.now()) {
    return cachedAppToken.token;
  }
  try {
    const res = await fetch(API + "/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.mlAppId,
        client_secret: env.mlAppSecret,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedAppToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cachedAppToken.token;
  } catch {
    return null;
  }
}

// app-token primeiro (estável); fallback p/ user-token do env.
export async function resolveToken(): Promise<string | null> {
  const app = await getAppToken();
  if (app) return app;
  return env.mlUserToken || null;
}

async function mlFetch(path: string, token: string | null): Promise<any> {
  const headers: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API + path, { headers });
  if (!res.ok) throw new Error(`ML ${res.status} ${path}`);
  return await res.json();
}

export type TrendingProduct = {
  position: number;
  id: string;
  name: string;
  image: string;
  price: number;
  seller_id: string | null;
  permalink: string;
  domain_id: string | null;
  listing_available: boolean;
};

export type TrendingSort = "position" | "price_asc" | "price_desc";

export type TrendingFilters = {
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  minPosition?: number;
  q?: string;
  sort?: TrendingSort;
  limit?: number;
};

const TREND_FETCH = 60; // base ampla p/ ter margem p/ filtrar

export function applyFilters(
  items: TrendingProduct[],
  f: TrendingFilters
): TrendingProduct[] {
  const q = f.q?.toLowerCase();
  return items.filter((it) => {
    if (f.minPrice != null && it.price < f.minPrice) return false;
    if (f.maxPrice != null && it.price > f.maxPrice) return false;
    if (f.sellerId != null && it.seller_id !== f.sellerId) return false;
    if (f.minPosition != null && it.position > f.minPosition) return false;
    if (q && !it.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortItems(
  items: TrendingProduct[],
  sort: TrendingSort = "position"
): TrendingProduct[] {
  const arr = [...items];
  if (sort === "price_asc") arr.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") arr.sort((a, b) => b.price - a.price);
  else arr.sort((a, b) => a.position - b.position);
  return arr;
}

export async function getTrendingByCategory(
  categoryId: string,
  opts: TrendingFilters = {}
): Promise<TrendingProduct[]> {
  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 50);
  const hasFilter =
    opts.minPrice != null ||
    opts.maxPrice != null ||
    opts.sellerId != null ||
    opts.minPosition != null ||
    (opts.q != null && opts.q.length > 0);
  // Sem filtro: busca só o necessário (rápido). Com filtro: base ampla.
  const fetchCount = hasFilter ? TREND_FETCH : Math.max(limit, 12);

  const token = await resolveToken();
  const hl = await mlFetch(`/highlights/MLB/category/${categoryId}`, token);
  const ids: string[] = (hl?.results ?? hl?.content ?? hl?.items ?? [])
    .filter((x: any) => x?.type === "PRODUCT")
    .slice(0, fetchCount)
    .map((x: any) => String(x.id));

  const out: TrendingProduct[] = [];
  const BATCH = 10;
  for (let start = 0; start < ids.length; start += BATCH) {
    const batch = ids.slice(start, start + BATCH);
    const results = await Promise.all(
      batch.map(async (id: string, bi: number) => {
        const position = start + bi + 1;
        try {
          const [prod, items] = await Promise.all([
            mlFetch(`/products/${id}`, token),
            mlFetch(`/products/${id}/items`, token).catch(() => null),
          ]);
          const pic = prod?.pictures?.[0]?.url ?? "";
          let price = 0;
          let seller_id: string | null = null;
          let permalink = prod?.permalink ?? "";
          let listing_available = false;
          const arr: any[] =
            items?.results ?? items?.items ?? (Array.isArray(items) ? items : []);
          const it = arr[0];
          if (it) {
            price = Number(it.price ?? 0);
            seller_id = it.seller_id ? String(it.seller_id) : null;
            const itemId = it.item_id ?? it.id;
            permalink =
              it.permalink ||
              (itemId
                ? `https://www.mercadolibre.com.br/${itemId}`
                : (prod?.permalink ?? ""));
            listing_available = true;
          }
          return {
            position,
            id,
            name: prod?.name ?? "",
            image: pic,
            price,
            seller_id,
            permalink,
            domain_id: prod?.domain_id ?? null,
            listing_available,
          } as TrendingProduct;
        } catch {
          // produto isolado falhou — mantém card mínimo para não quebrar a lista
          return {
            position,
            id,
            name: "",
            image: "",
            price: 0,
            seller_id: null,
            permalink: "",
            domain_id: null,
            listing_available: false,
          } as TrendingProduct;
        }
      })
    );
    out.push(...results);
  }

  const filtered = applyFilters(out, opts);
  const sorted = sortItems(filtered, opts.sort);
  return sorted.slice(0, limit);
}
