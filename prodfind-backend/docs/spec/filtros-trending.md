# Spec — Filtros no `/api/trending` (ProdFind)

## Endpoint
`GET /api/trending`
Params (adicional aos existentes `category`, `limit`):
- `minPrice?` number (BRL, >= 0)
- `maxPrice?` number (BRL, >= minPrice)
- `sellerId?` string
- `minPosition?` number (só rank <= N)
- `q?` string (substring case-insensitive no `name`)
- `sort?` `'position' | 'price_asc' | 'price_desc'` (default `position`)

## Validação (`src/lib/validate.ts`)
Estender `trendingQuerySchema` (zod):
- `minPrice`/`maxPrice` → `z.coerce.number()`, `maxPrice >= minPrice`.
- `sellerId` → `z.string()`.
- `minPosition` → `z.coerce.number().int().positive()`.
- `q` → `z.string().min(2).max(60)`.
- `sort` → `z.enum([...]).default('position')`.

## Pipeline (`src/lib/ml-highlights.ts`)
Constante `TREND_FETCH = 60` (busca 60 do highlights p/ ter margem p/ filtrar).
1. `getTrendingByCategory(category, TREND_FETCH)` → enriquece (já existe).
2. `applyFilters(items, {minPrice,maxPrice,sellerId,minPosition,q})`:
   - `price` entre `minPrice`/`maxPrice` (se informado)
   - `seller_id === sellerId` (se informado)
   - `position <= minPosition` (se informado)
   - `name` inclui `q` (case-insensitive, se informado)
3. `sortItems(items, sort)`.
4. `slice(0, limit)`.
Retorna `TrendingProduct[]`.

## Cache (`src/app/api/trending/route.ts`)
`cacheKey = trending:{category}:{minPrice}:{maxPrice}:{sellerId}:{minPosition}:{q}:{sort}:{limit}`
TTL 10min.

## Rate limit
Mantém 30/min/IP.

## Erros
400 (zod) / 502 (ML indisponível) — iguais.

## Latência
Alvo < ~2s com cache quente. Busca das 60 chamadas `/products` + `/items` em `Promise.all`
em lotes (ex.: 10 por lote) p/ não abrir 120 conexões de uma vez.

## Arquivos tocados
- `src/lib/validate.ts` (schema)
- `src/lib/ml-highlights.ts` (`applyFilters` + `sortItems` + `TREND_FETCH`)
- `src/app/api/trending/route.ts` (parse dos filtros + `cacheKey` + repasse)

## Fora de escopo
`sold_quantity` (bloqueado ML), filtro por categoria (já existe), auth de usuário.
