// Integração com a API do Mercado Livre (site MLB = Brasil).
//
// DESCOBERTA 23/07 (testado daqui de Cuiabá/Claro):
//  - A busca LEGADA `/sites/MLB/search` e o endpoint de anúncio `/items/{id}`
//    ESTÃO BLOQUEADOS (403/404). Provável: falta da permissão
//    "Leitura de anúncios" na app OU WAF de IP nas APIs legadas.
//  - A API de CATÁLOGO `/products/search` FUNCIONA autenticada e traz
//    nome / categoria (domain_id) / atributos / children_ids.
//  - Preço e vendas (sold_quantity) ficam no nível de ANÚNCIO (listing),
//    só entram quando a permissão de listing for liberada (ou rodar de IP liberado).
//
// Estratégia atual: usar /products/search (catálogo) como base. Quando a
// permissão de anúncios estiver OK, enriquecemos com preço/vendas via
// buy_box_winner ou /items/{id}.
//
// Fluxo de auth: client_credentials -> Bearer token -> chamadas.

import { env } from "./env";

type TokenCache = { token: string; expiresAt: number } | null;
let cachedToken: TokenCache = null;

async function getAppToken(): Promise<string | null> {
  if (!env.mlAppId || !env.mlAppSecret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ProdFind/1.0 (+https://prodfind.com.br)",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.mlAppId,
      client_secret: env.mlAppSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`ML token ${res.status}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export type MLItem = {
  id: string;
  title: string;
  price: number;
  price_avg: number;
  sold: number;
  permalink: string;
  thumbnail: string;
  seller?: { nickname: string };
  domain_id?: string;
  children_count?: number;
  listing_data_available: boolean;
};

export async function mlSearch(q: string, limit = 12): Promise<MLItem[]> {
  const token = await getAppToken();
  const headers: Record<string, string> = {
    // ML barra requests sem User-Agent (trata como bot)
    "User-Agent": "ProdFind/1.0 (+https://prodfind.com.br)",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Catálogo: funciona autenticado (busca legada /sites/MLB/search está bloqueada).
  const url = `https://api.mercadolibre.com/products/search?site_id=MLB&q=${encodeURIComponent(
    q
  )}&limit=${limit}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    // 403/404 das APIs legadas cai aqui — esperado até liberar permissão de anúncios
    throw new Error(`MercadoLivre ${res.status}`);
  }

  const data: unknown = await res.json();
  const results = (data as { results?: any[] }).results ?? [];

  return results.map((r) => {
    const pictures: any[] = r.pictures ?? [];
    const pic = pictures[0];
    return {
      id: String(r.catalog_product_id ?? r.id),
      title: r.name ?? "",
      // Preço/vendas ficam no nível de anúncio (bloqueado por ora).
      price: 0,
      price_avg: 0,
      sold: 0,
      permalink: r.permalink ?? "",
      thumbnail: pic?.url ?? pic?.secure_url ?? "",
      domain_id: r.domain_id,
      children_count: (r.children_ids ?? []).length,
      listing_data_available: false,
    };
  });
}
