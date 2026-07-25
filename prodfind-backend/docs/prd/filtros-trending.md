# PRD — Filtros no `/api/trending` (ProdFind)

## Problema
Hoje o `/api/trending` devolve o top-N por categoria, cru. O usuário de *product research*
não consegue afunilar por preço, seller ou posição de venda — que é o diferencial de uma
ferramenta de research vs. só "ver o que vende mais". Sem filtros, o ProdFind entrega apenas
o ranking bruto do Mercado Livre.

## Usuário
Seller / afiliado ML que quer achar produtos com oportunidade — filtrando por faixa de preço
(pra calcular margem/lucro), seller (pra espionar concorrência) e posição (só o topo de vendas).

## Métrica de sucesso
- % de sessões que aplicam ≥ 1 filtro.
- Aumento de tempo na página de resultados.
- (indireta) trial→pago sobe com filtros úteis.

## Escopo
### Filtros (query params em `GET /api/trending`)
- `minPrice` / `maxPrice` (BRL) — filtra pelo preço do item líder.
- `sellerId` — só produtos desse seller.
- `minPosition` — só top N do ranking (ex.: top 10).
- `q` — substring no nome do produto.
- `sort` — `position` (default), `price_asc`, `price_desc`.
- `limit` (já existe, 1–50).

### Não-escopo (agora)
- `sold_quantity` (vendas exatas) — bloqueado pela API ML (`/items?ids=` → 403).
  Usamos `position` do `/highlights` como proxy de vendas.
- Filtro por categoria — já existe (`category`).
- Auth de usuário nos filtros — endpoint segue público.

## Como funciona (técnico, resumo)
1. Busca ~60 do `/highlights/MLB/category/{cat}` (ranking).
2. Enriquece com `/products/{id}` (nome+foto) + `/products/{id}/items`
   (preço+seller+link) — pipeline já implementado em `ml-highlights.ts`.
3. Aplica filtros (preço / seller / position / keyword) no pipeline — o ML não aceita
   esses filtros no `/highlights`, então filtramos depois de enriquecer.
4. Ordena conforme `sort` e retorna `limit` itens.
5. Cache 10min mantido.

## Risco / mitigação
- Nº de chamadas ML sobe (~60 produtos × 2 calls). Mitigar com cache + paralelizar fetches.
- Latência: manter < ~2s com cache quente.

## Próximo
Spec-First → implementar em `ml-highlights.ts` (filtro+sort) + `validate.ts` (zod) + `route.ts`.
