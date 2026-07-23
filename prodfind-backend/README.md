# ProdFind — Backend (por fora do Lovable)

Backend da API do ProdFind. O frontend (Lovable) consome esta API via `NEXT_PUBLIC_API_URL`.
O banco é **Supabase (instância própria)**, acessado **só pelo backend** (nunca pelo frontend).
**Redis (Upstash)** faz cache de leitura + rate limit, pra o server não ficar lento e não bater no Supabase/ML a cada request.

## Stack
- Next.js 16 (App Router, route handlers) + TypeScript
- Supabase (Postgres + RLS) — instância própria
- Redis (Upstash) — cache + rate limit
- zod — validação de input
- (em breve) SuperTokens (auth) + Stripe/Asaas (pagamento)

## Por que Redis?
O medo era: "pico de requisição derruba o site" e "buscar tudo no Supabase deixa lento".
Resolvido com:
- **Cache de leitura**: resultados de busca (ML) e dados de leitura ficam no Redis (TTL). Acerta o Redis, não o Supabase/ML.
- **Rate limit**: janela deslizante no Redis por IP/rota — abuso não derruba o serviço.
- **Pooler/RLS/validação**: ver skill `prodfind-backend`.

## Como rodar
```bash
cp .env.example .env.local   # preencha SUPABASE_* e REDIS_*
npm install
npm run dev                  # http://localhost:3000 (API)
npm run typecheck            # checa tipos
npm run build && npm start   # produção
```

## Rotas implementadas
- `GET  /api/health`  → status (redis/supabase configurados?)
- `POST /api/leads`   → captura de lead (zod + rate limit + grava no Supabase)
- `GET  /api/search?q=` → busca no Mercado Livre, **cacheada no Redis**, com margem/imposto BR
- `GET  /api/me`      → placeholder (SuperTokens entra na próxima etapa)

## Próximos passos
1. SuperTokens (Google social) + `/api/me` real
2. `/api/saved-products` e `/api/alerts` (com RLS + escopo por user)
3. `/api/checkout` (Stripe + Asaas/PIX) + webhook
4. Custo real de fornecedor (CJ/AliExpress) no cálculo de margem

## Modelo de dados
Ver `supabase/schema.sql` (tabelas + RLS). Rode no SQL editor do Supabase.
