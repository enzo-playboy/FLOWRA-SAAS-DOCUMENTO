# PRODFIND — PRD de Produto (Lovable = FRONTEND)

> **PRD oficial para o Lovable construir o FRONTEND do ProdFind.**
> **Decisão de arquitetura (23/07): o Lovable faz SÓ O FRONTEND.** O backend (banco, auth, integrações) é construído **SEPARADAMENTE ("por fora")** e exposto via API REST. O frontend consome essa API.
> Preços finais: START R$79 / PRO R$147 / AGÊNCIA R$297 (trial 7d s/ cartão). Idioma: **PT-BR**.

## 1. O que é o ProdFind (Visão)

**ProdFind** é um SaaS brasileiro de *product research* + *supply chain intelligence* para sellers de **Mercado Livre** e (depois) **TikTok Shop**.

Ele ajuda o seller a:
- Descobrir **produtos campeões** no Mercado Livre (via API oficial, grátis)
- Ver **score de demanda** (IA) e tendência de cada produto
- Calcular **margem líquida real** incluindo **imposto de importação BR** (II 60% + ICMS por estado + frete)
- Encontrar **fornecedor sugerido** (CJ Dropshipping / AliExpress) com preço de custo
- Receber **alertas** quando um produto entra em alta

**Tagline:** *"Descubra o próximo produto campeão."*

**Diferencial (gap de mercado):** não existe ferramenta BR que junte descoberta + fornecedor + imposto BR + margem num só lugar.

---

## 2. Problema e Público

Sellers BR não têm inteligência de produto nacional:
- Internacionais (Kalodata, Tabcut): caras (USD 50–300/mês), sem dados BR, UI em inglês/mandarim
- Planilhas manuais: trabalho braçal, sujeito a erro
- "Na tentativa e erro": compram estoque sem saber se vai vender

| Perfil | Descrição | Plano |
|--------|-----------|-------|
| **MEI / PF** | Seller casual no ML, R$ 2–8k/mês | START (R$ 79/mês) |
| **Pequeno PJ** | Loja formal, R$ 15–80k/mês | PRO (R$ 147/mês) |
| **Médio PJ / Agência** | Multi-canal, R$ 80k+/mês | AGÊNCIA (R$ 297/mês) |

**TAM:** ~600k sellers ativos no Brasil (ML + TikTok).

---

## 3. Modelo de Negócio (Planos FINAIS)

| Plano | Preço | Inclui | Público |
|-------|-------|--------|---------|
| 🆫 **Trial** | **Grátis 7 dias, SEM cartão** | ML completo, ilimitado | Qualquer um |
| 🟢 **START** | **R$ 79/mês** | ML + score IA + fornecedor + imposto BR + margem | MEI / iniciante |
| 🔵 **PRO** | **R$ 147/mês** | Tudo do START + TikTok (futuro) + extensão Chrome + alertas avançados | Seller profissional |
| 🏢 **AGÊNCIA** | **R$ 297/mês** | API + white-label + 5 seats + dados exclusivos | Agências (futuro) |

**Monetização extra:** comissão de afiliados (3–8%) sobre produtos via link ML/Shopee/AliExpress.
**Break-even:** 1 assinante START cobre custos fixos (margem ~97%).

---

## 4. Stack & Arquitetura

### FRONTEND (construído no Lovable)
| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19** + **Tailwind CSS v4** + componentes **shadcn/ui** |
| Linguagem | **TypeScript 5** |
| Auth (SDK) | **SuperTokens React** (aponta pro backend de auth) |
| Idioma | **PT-BR** em toda a UI |
| Deploy | Vercel / Railway |

### BACKEND (feito POR FORA, separado do Lovable)
| Camada | Tecnologia |
|--------|-----------|
| Banco de dados | **Supabase (instância própria)** via API — **NÃO** o Supabase nativo do Lovable |
| Auth (core) | **SuperTokens** (Google social) |
| Pagamento | **Stripe** (cartão) + **Asaas** (PIX/boleto) |
| Dados | **Mercado Livre API** (oficial, grátis) |

### Comunicação
- Frontend ↔ Backend via **REST**, base URL em `NEXT_PUBLIC_API_URL`
- O frontend NUNCA toca o banco direto — só chama a API do backend

> ⚠️ **O Lovable constrói SÓ O FRONTEND.** Não criar banco, auth ou backend dentro do Lovable.
> ⚠️ **NÃO usar o Supabase nativo do Lovable.**
> ⚠️ **NÃO usar HTML solto** — gerar código Next 16 + Tailwind v4 real.

---

## 5. API Contract (o que o frontend espera do backend)

Base: `NEXT_PUBLIC_API_URL`

| Método | Endpoint | Corpo / Params | Retorno |
|--------|----------|----------------|---------|
| `POST` | `/api/leads` | `{ email, source }` | `{ ok }` |
| `POST` | `/auth/google` | (SuperTokens) | sessão + usuário |
| `GET` | `/api/me` | — | `{ id, email, plan, trial_ends_at, is_trial }` |
| `GET` | `/api/search?q=<termo>` | query string | `{ items: [{ id, title, price_now, price_avg, demand_score, trend, sellers, cost, margin_pct, margin_value, supplier:{name,cost} }] }` |
| `POST` | `/api/saved-products` | `{ product_external_id, cost, margin_pct }` | `{ ok }` |
| `GET` | `/api/saved-products` | — | lista |
| `POST` | `/api/alerts` | `{ product_external_id, threshold }` | `{ ok }` |
| `GET` | `/api/alerts` | — | lista |
| `POST` | `/api/checkout` | `{ plan }` | `{ url }` (Stripe session) |
| `POST` | `/api/webhooks/stripe` | (interno) | atualiza assinatura |

---

## 6. MVP — Fase 1 (FRONTEND que o Lovable constrói)

**Foque só nisso.** Backend já existe/aparece por fora.

### 6.1 Landing Page (pública)
- Hero + proposta de valor + CTA **"Continuar com Google"**
- 3–6 cards de features (descoberta, score IA, margem c/ imposto, fornecedor)
- Bloco de planos (START R$79 / PRO R$147 / AGÊNCIA R$297 + Trial 7d s/ cartão)
- Captura de lead → `POST /api/leads`
- Responsiva (mobile-first), SEO metadata PT-BR

### 6.2 Autenticação (Trial)
- SuperTokens React SDK → login Google social (core por fora)
- Conta inicia trial 7d (backend)
- Proteção de rotas do dashboard

### 6.3 Dashboard de Busca (ML)
- Input de categoria/termo → `GET /api/search?q=`
- Resultados em cards com: preço, **score de demanda**, tendência, nº vendedores, **margem líquida** (c/ imposto BR), **fornecedor sugerido**
- Favoritar (`POST /api/saved-products`) e criar alerta (`POST /api/alerts`)

### 6.4 Cálculo de Margem / Imposto BR (no frontend, p/ exibição)
- `lib/margin.ts`: II 60% + ICMS por estado + frete; `margin = price − (cost + II + ICMS + frete)`
- Fonte de verdade (preço/custo) vem do backend; o cálculo é determinístico e roda no front

### 6.5 Pricing / Checkout (pós-trial)
- Tela de planos → `POST /api/checkout` → abre Stripe/Asaas (cartão ou PIX)

---

## 7. Modelo de Dados (BACKEND — referência, NÃO do Lovable)

```sql
users         (id uuid, email, plan text, trial_ends_at timestamptz, created_at)
leads         (id, email, source, created_at)
searches      (id, user_id, query, results_json, created_at)
saved_products(id, user_id, product_external_id, cost, margin_pct, created_at)
alerts        (id, user_id, product_external_id, threshold, created_at)
subscriptions (id, user_id, plan, status, stripe_sub_id, created_at)
```

---

## 8. Fluxo do Usuário (MVP)

```
1. LANDING → vê valor + planos (R$79 / R$147 / R$297 + trial 7d)
2. "Continuar com Google" → SuperTokens (backend) → inicia trial 7d
3. DASHBOARD → busca → GET /api/search?q=  (backend consome ML API)
4. RESULTADOS → preço, score, tendência, margem (c/ imposto BR), fornecedor
5. FAVORITA (POST /api/saved-products) / ALERTA (POST /api/alerts)
6. PÓS-TRIAL → POST /api/checkout → Stripe/Asaas (cartão ou PIX)
7. USO CONTÍNUO → buscas, favoritos, alertas
```

---

## 9. FORA DO ESCOPO (fases posteriores — NÃO construir agora)

- TikTok Shop (scraping) — Fase 3
- Extensão Chrome — Fase 4
- CJ Dropshipping como fulfillment/venda — adiado (risco operacional)
- API pública + white-label (AGÊNCIA) — Fase 5
- Agentes IA de marketing/suporte — pós-validação
- i18n completo (só PT-BR por enquanto)

---

## 10. Direção de Design

- Componentes **shadcn/ui** (Tailwind limpo, neutro, profissional)
- Mobile-first, responsivo
- CTA principal: **"Continuar com Google"**
- Cores sóbrias (branco/cinza + 1 cor de destaque), não gradiente psicodélico
- PT-BR em todo texto de UI
- Tabelas/ícones para comunicar margem e score

---

## 11. Métricas de Sucesso (MVP)

- Landing no ar (semana 1) · 50+ leads (semana 2) · 10+ trials (semana 3)
- 3+ assinantes pagos (mês 1) · Churn < 5% mensal

---

## 12. Time

- **Enzo** (CEO/Produto) — visão, estratégia, vendas
- **Hermes Agent** — arquitetura, dev, agentes IA

---

*Atualizado 23/07/2026. Arquitetura: Lovable = frontend only; backend por fora (DB próprio via API, SuperTokens, Stripe/Asaas, ML API). Preços: START R$79 / PRO R$147 / AGÊNCIA R$297.*
