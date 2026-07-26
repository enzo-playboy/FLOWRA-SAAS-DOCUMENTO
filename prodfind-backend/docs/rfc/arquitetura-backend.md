# RFC-002 — Arquitetura do Backend ProdFind (resiliente & seguro)

- **Status:** Draft
- **Autor:** Hermes (com Enzo)
- **Relacionado:** RFC-001 (`auth-supertokens.md`), PRD `auth-supertokens.md`, skill `prodfind-backend`
- **Decisão de processo:** PRD → RFC → Spec → código. Este é o RFC "backbone" que fixa as decisões transversais (DB, rate limit, cache, segurança, resiliência). O auth tem RFC próprio (RFC-001).

---

## 1. Contexto
O ProdFind é um SaaS de product research para Mercado Livre. Decisão de 23/07: o **Lovable faz SÓ o frontend** (Next 16 / Tailwind v4 / shadcn, PT-BR); o **backend é feito por fora**, separado. Motivos: controle de custo (preço baixo, volume), evitar que o Lovable trave sob pico, e manter segredos/integrações (ML API, Stripe/Asaas, SuperTokens) fora do escopo do Lovable.

Dois medos do Enzo dirigem toda decisão arquitetural:
1. **"Pico de requisição derruba o site"** → o backend tem que absorver rajada sem cair.
2. **"Problemas de segurança"** → dados de usuário, sessões e segredos protegidos por design.

Este RFC consolida as escolhas de infra que valem para TODAS as rotas, referenciando o RFC-001 para o detalhe de auth.

## 2. Objetivos
- Backend 100% separado do Lovable, acessível só via REST (`NEXT_PUBLIC_API_URL`).
- Absorver picos (rate limit + cache + pooler + edge + stateless).
- Segurança por padrão (RLS, CORS restrito, zod, sessão derivada, secrets em env).
- Degradação graciosa quando ML API ou Stripe falham (nunca trava o request).
- Serverless-friendly (sem estado em memória; Upstash Redis/KV).

## 3. Não-objetivos
- Frontend/Lovable em si (aqui só o contrato REST).
- Decisões de produto/preço (ver pricing council).
- Detalhe de auth (RFC-001).
- ML scraper / workaround de WAF (usamos só endpoints liberados; ver §5).

## 4. Componentes & diagrama
```
[Lovable: Next 16 front] --REST (NEXT_PUBLIC_API_URL)--> [Backend: Next.js App Router]
                                                       |
   +---------------------------------------------------+-----------------------------------+
   |  Route handlers (/api/*)                         |                                   |
   |   - zod validate  - rate limit (Upstash)         |                                   |
   |   - getSession (SuperTokens)  - cache (Redis)    |                                   |
   |                                                   |                                   |
   v                                                   v                   v                 v
[Supabase: Postgres + RLS]                  [ML API: /highlights +        [SuperTokens Core]
(pooler pgbouncer :6543)                    /products/{id}/items]          (Google social)
                                            (Bearer token, UA obrigatório)  [Stripe/Asaas]
                                                                           (PIX/boleto)
```
- Frontend NUNCA acessa Supabase nem ML API direto — só via backend.
- Deploy: Vercel ou Railway (serverless, auto-scale). Supabase e SuperTokens são serviços gerenciados.

## 5. Integração Mercado Livre (core de dados)
Decisão validada empiricamente (24–25/07): o endpoint de busca `/sites/MLB/search` está **MORTO** (403 de WAF, qualquer IP, mesmo residencial). O core do ProdFind usa:
- **`GET /highlights/MLB/category/{id}`** — ranking de best-sellers por categoria (top 20, `position` 1 = mais vendido). EXIGE Bearer token. Categoria tem que ser **folha** (sem subcategoria).
- **`GET /products/{id}`** — nome (`name`) + foto (`pictures[].url`). Link (`permalink`) vem vazio no catálogo.
- **`GET /products/{id}/items`** — `price` + `seller_id` + `item_id` (link montado: `https://www.mercadolibre.com.br/{item_id}`). 1 hop, com token.
- **Token:** `client_credentials` (`ML_APP_ID`+`ML_APP_SECRET`) com fallback `ML_USER_TOKEN`; `User-Agent` obrigatório; timeout 8s (`AbortController`).
- **`sold_quantity` BLOQUEADO** (nem user nem app-token) → usar `position` como proxy de "mais vendido".
- **Cache:** Redis TTL 5–60min nas respostas do ML (dados mudam devagar) → reduz chamadas externas e carga no DB.

## 6. Banco de dados (Supabase próprio)
- **Instância PRÓPRIA** da equipe (NÃO o Supabase nativo que o Lovable criaria).
- **Pooler de conexão (CRÍTICO):** connection string do **transaction pooler** (`porta 6543`, `?pgbouncer=true` / `mode=pooled`) em serverless. Sem isso cada request abre conexão e o Postgres estoura o limite → site cai. Este é o item #1 contra o medo de pico.
- **RLS LIGADO** em todas as tabelas. Service role key NUNCA vai pro frontend; anon key só onde necessário e com RLS restritiva.
- Ownership: consultas filtram por `id = session.userId` (service role bypassa RLS → ownership garantido em app).
- **Backup PITR** ligado.
- ORM: Prisma ou Drizzle configurado com o pooler.
- Schema resumo (ver skill `prodfind-backend` §Modelo de Dados): `users`, `leads`, `searches`, `saved_products`, `alerts`, `subscriptions`.

## 7. Rate limit (todas as rotas públicas) — validado pelo Conselho de LLMs (25/07)
- **Upstash Ratelimit** (token bucket) — estado em **Redis (in-memory, compartilhado)**. Certo p/ serverless: memória de processo local seria por-instância e ineficaz. Checagem <5ms no Redis; ponta-a-ponta ~10–50ms via REST (não perceptível; mitigado por fail-open + pinagem de região). Conselho confirmou: é a escolha certa, não deixa o site lento.
- **Pinar região:** Upstash `sa-east-1-1` = Vercel `gru1` (São Paulo) → mantém latência baixa.
- **Identificador:** autenticado → `user_id` (imune a NAT/CGNAT); anônimo → **NÃO usar IP puro** (CGNAT BR faz milhares dividirem 1 IPv4 → falso positivo em massa). Usar composite `hash(IP + User-Agent + device_id)`; longo prazo, exigir login mínimo pra buscar.
- **Dois limitadores distintos:**
  1. **Limite de UX por usuário** (protege teu compute + custo Upstash) — tabela abaixo.
  2. **Guarda global de upstream do ML** (token bucket keyed pelo **app token do ML**, teto duro + backoff) — é o que protege a cota compartilhada e a margem de verdade. Cache (TTL 5–60min) é a 1ª linha de defesa do ML.
- **Fail mode assimétrico:** fail-open pros limites de UX (com circuit breaker → limite em memória LRU degradado se Redis sumir); **fail-closed/circuit-breaker na chamada ao ML** (o ativo insubstituível é a cota do ML, não o Redis). `timeout: 800ms` no `@upstash/ratelimit` → fail-open embutido.
- **Stripe webhook:** verificar **assinatura** (`whsec`), NÃO IP allowlist (Stripe rotaciona egress IP → allowlist quebra e perde cobranças).
- **Não hardcoded:** limites em env/config; começar conservador e tunar com dados (§9 Observabilidade). Valores abaixo são ponto de partida, não dogma.

### Tabela de limites (token bucket, janela 60s) — início conservador
| Rota | Anônimo | Autenticado | Notas |
| `/api/search` | 5/min | 20/min* | *sobe p/ 30 após 2 semanas de dados; core ML |
| `/api/trending` | 10/min | 40/min* | *sobe p/ 60 após dados; já tinha 30/min/IP |
| `/api/leads` | 3/min | 3/min | anti-spam |
| `/api/auth/*` | 20/min | 20/min | ⚠️ 5/min travava refresh/login (self-lockout) |
| `/api/saved-products` | 20/min | 60/min | escrita barata |
| `/api/alerts` | 20/min | 60/min | escrita barata |
| `/api/checkout` | 3/min | 3/min | anti-fraude |
| `/api/webhooks/stripe` | — | — | assinatura whsec (não IP) |
| Guarda ML (global) | — | — | token bucket no app token; teto = fração do limite do ML (medir) |

- Já implementado em `/api/search` e `/api/trending`. Padronizar via wrapper `lib/ratelimit.ts` + `withRateLimit.ts` (identifier `userId ?? ip`, fail-open).
- ✅ **Implementado (25/07):** `src/lib/ratelimit.ts` + `src/lib/withRateLimit.ts`; rotas `/api/search`, `/api/trending`, `/api/leads` migradas. `@upstash/ratelimit` instalado. Guarda global `mlGuard` aplicada em search/trending (fail-closed). Valores via env (`RL_*`).

## 8. Cache
- **Upstash Redis**: cache de respostas do ML API (TTL 5–60min), e pode cachear resultados de busca/trending.
- `/api/trending` já usa cache 10min + `cacheKey` por filtro.
- Degradação: se ML API cai, serve cache; se cache vazio, retorna 502 amigável (não trava).

## 9. Segurança (mitiga medos do Enzo)
- **Sessão derivada:** `getSession(req)` em TODA rota protegida; NUNCA confiar em `userId` vindo do cliente (RFC-001).
- **Validação zod** em todo body/param → input ruim não quebra o server (e evita injeção).
- **CORS:** permitir só a origem do frontend. Bloquear `*`.
- **Segredos em env** (Vercel/Railway/.env.local): Supabase service role, SuperTokens, Stripe, ML creds — NUNCA no código/git.
- **Captcha Turnstile** em lead/auth contra bots.
- **Logs/monitor:** Supabase Logs + Vercel + Sentry; alerta de 5xx e latency.

## 10. Resiliência sob pico
1. Pooler de conexão (§6) — item crítico.
2. Rate limit (§7) — todas rotas públicas.
3. Cache (§8) — reduz carga externa/DB.
4. Edge runtime para rotas leves (health, lead capture).
5. Timeouts + degradação graciosa (§5/§8).
6. Trabalho pesado assíncrono (scoring IA / alertas) em fila (QStash/Inngest) — nunca no request síncrono.
7. Stateless + auto-scale (deploy Vercel/Railway) — sem estado em memória.

## 11. Contrato de API (status)
Base: `NEXT_PUBLIC_API_URL`. Legenda: ✅ built / 🔲 spec / ⬜ RFC.

| Método | Endpoint | Status |
|--------|----------|--------|
| POST | /api/leads | ✅ (com rate limit) |
| POST | /api/auth/* | 🔲 (RFC-001 definido; Spec pendente) |
| GET | /api/me | ⬜ (stub 401; RFC-001 desenha) |
| GET | /api/search?q= | ✅ (rate limit + cache Redis + calcMargin BR) |
| GET | /api/trending?... | ✅ (rate limit + cache + filtros) |
| POST | /api/saved-products | ⬜ |
| GET | /api/saved-products | ⬜ |
| POST | /api/alerts | ⬜ |
| GET | /api/alerts | ⬜ |
| POST | /api/checkout | ⬜ (Stripe/Asaas) |
| POST | /api/webhooks/stripe | ⬜ |

## 12. Alternativas consideradas
- **Postgres direto sem pooler** → rejeitado: estoura conexões em serverless (medo de pico).
- **Supabase nativo do Lovable** → rejeitado: decidimos backend próprio (23/07).
- **Cache em memória** → rejeitado: serverless é efêmero; usar Redis/KV.
- **JWT custom p/ auth** → rejeitado (RFC-001): mais risco de falha de segurança.
- **Scraper do /sites/MLB/search** → rejeitado: 403 de WAF, qualquer IP.

## 13. Perguntas em aberto
1. Deploy final: Vercel ou Railway? (ambos serverless/auto-scale) — **aberto**.
2. Thresholds de rate limit — **DECIDIDOS** (§7, validados pelo Conselho 25/07): início conservador + tunar com dados. Valores finais após 2 semanas de tráfego real.
3. QStash vs Inngest p/ jobs assíncronos (quando alerts/scoring entrarem) — **aberto**.
4. `ML_USER_TOKEN` precisa ser rotacionado/refresh? (app-token basta com creds válidas) — **aberto**.
5. **Novo (do Conselho):** qual o limite REAL da API do ML (req/min por app)? Medir empiricamente (carga até 429/403) antes de fixar a guarda global — **bloqueante**.

## 14. Riscos & mitigação
- Pooler mal configurado → site cai sob carga → validar `?pgbouncer=true` em prod cedo.
- WAF do ML bloquear novo endpoint → ter pipeline validado (`/highlights` + `/products/{id}/items`) como única fonte.
- Segredo vazado → rotação + never-in-git (pre-commit scan).
- Pico em `/api/trending` → cache 10min absorve; rate limit protege.

## 15. Próximo
Aprovar → Spec por rota (começar por `/api/auth/*` + `/api/me` do RFC-001, depois saved-products/alerts/checkout) → código. Manter checklist por rota (zod, RLS, rate limit, cache, secret, CORS) do skill `prodfind-backend`.
