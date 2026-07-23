// Integração com a API pública do Mercado Livre (site MLB = Brasil).
// Search básico não exige autenticação.

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
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(
    q
  )}&limit=${limit}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mercado Livre API retornou ${res.status}`);
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
