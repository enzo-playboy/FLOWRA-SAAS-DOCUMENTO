// Integração com a API do Mercado Livre (site MLB = Brasil).
// Search funciona anônimo na maioria dos IPs; de datacenters/VMs o ML pode
// responder 403 — nesse caso, configure ML_APP_ID/ML_APP_SECRET e a chamada
// vira autenticada (Bearer token), com limites maiores.

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
};

export async function mlSearch(q: string, limit = 12): Promise<MLItem[]> {
  const token = await getAppToken();
  const headers: Record<string, string> = {
    // ML barra requests sem User-Agent (trata como bot)
    "User-Agent": "ProdFind/1.0 (+https://prodfind.com.br)",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(
    q
  )}&limit=${limit}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    // 403 de IP bloqueado cai aqui — esperado em alguns ambientes
    throw new Error(`MercadoLivre ${res.status}`);
  }

  const data: unknown = await res.json();
  const results = (data as { results?: any[] }).results ?? [];

  return results.map((r) => ({
    id: String(r.id),
    title: r.title,
    price: Number(r.price) || 0,
    price_avg: Number(r.original_price) || Number(r.price) || 0,
    sold: Number(r.sold_quantity) || 0,
    permalink: r.permalink,
    thumbnail: r.thumbnail,
    seller: r.seller ? { nickname: r.seller.nickname } : undefined,
  }));
}
