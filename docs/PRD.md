# PRODFIND — Product Requirements Document

## 📋 Resumo Executivo

**ProdFind** é um SaaS brasileiro de product research para sellers de Mercado Livre e TikTok Shop. Ajuda sellers a descobrirem produtos campeões, analisar tendências de mercado, calcular margens reais e encontrar fornecedores — tudo em uma plataforma.

**Tagline:** "Descubra o próximo produto campeão"

## 🎯 Problema

Sellers brasileiros de marketplace não têm ferramentas nacionais de inteligência de produto. As opções existentes são:
- Internacionais (Kalodata, Tabcut, Nox) — caras (USD $50-500/mês), sem dados BR, UI em inglês/mandarim
- Planilhas manuais — trabalho braçal, sujeito a erro
- "Na tentativa e erro" — sellers compram estoque sem saber se vai vender

## 👥 Público-Alvo

| Perfil | Descrição | Quantidade | Disposição a Pagar |
|--------|-----------|-----------|-------------------|
| **MEI / PF** | Seller casual no ML, fatura R$ 2-8k/mês | ~400k | R$ 37-57/mês |
| **Pequeno PJ** | Loja formalizada, 1-5 funcionários, R$ 15-80k/mês | ~150k | R$ 57-147/mês |
| **Médio PJ** | Seller profissional, múltiplos canais, R$ 80k+/mês | ~50k | R$ 147-297/mês |
| **Criador de Conteúdo** | Faz lives/ vídeos no TikTok Shop | ~15k | R$ 37-57/mês |

**TAM:** ~600k sellers ativos no Brasil (ML + TikTok)

## 💰 Modelo de Negócio

### Planos

| Plano | Preço | Funcionalidades | Público |
|-------|-------|----------------|---------|
| 🆓 **Trial** | **Grátis 7 dias** | ML completo, ilimitado | Qualquer um |
| 🟢 **START** | **R$ 37/mês** | ML + score IA + alerts básicos | MEI / iniciante |
| 🔵 **PRO** | **R$ 57/mês** | ML + TikTok + extensão Chrome + margem BR + alerts tempo real | Seller profissional |
| 🏢 **Agência** | R$ 297/mês | API + multi-usuário + white-label | Agências (futuro) |

### Monetização Adicional

**Comissão de Afiliados (Revenue Share):**
- Cada produto descoberto tem link de afiliado (ML, Shopee, AliExpress)
- ProdFind ganha 3-8% sobre cada venda gerada
- Seller paga o mesmo preço — não sai do bolso dele
- Projeção: +15-30% sobre receita de assinatura

### Projeções Financeiras

| Cenário | Assinantes | Receita Assinatura | + Afiliados | Lucro Líquido |
|---------|-----------|-------------------|-------------|---------------|
| 🚶 Péssimo | 3 PRO | R$ 165/mês | R$ 178/mês | R$ 124/mês |
| 👍 OK | 10 START + 5 PRO | R$ 629/mês | R$ 696/mês | R$ 642/mês |
| 🔥 Bom | 30 START + 15 PRO | R$ 1.886/mês | R$ 2.088/mês | R$ 2.034/mês |
| 🚀 Crescendo | 80 START + 40 PRO | R$ 5.028/mês | R$ 5.568/mês | R$ 5.514/mês |

**Break-even:** 1 assinante PRO cobre custos fixos (servidor + domínio)

## 🏗️ Arquitetura do Produto

### MVP — Fase 1 (Agora)

```
Frontend: Landing page HTML + cadastro via Supabase
Backend: API Mercado Livre (grátis)
Banco: Supabase
Pagamento: Stripe + Asaas (PIX/boleto)
Autenticação: SuperTokens (grátis até 5k usuários)
```

### Fase 2 — SaaS Web

```
Frontend: Next.js + Tailwind
Backend: Next.js API Routes + Supabase Edge Functions
Banco: Supabase
Pagamento: Stripe (cartão) + Asaas (PIX/boleto)
Auth: SuperTokens
Deploy: Vercel (R$ 0-50/mês)
Domínio: R$ 4/mês
```

### Fase 3 — Expansão

```
+ TikTok Shop (scraping com proxies)
+ Extensão Chrome
+ Agentes IA (análise de logs, campanhas de marketing)
+ API pública (plano Agência)
```

## 🧠 Stack Técnica

| Componente | Tecnologia | Custo | Por quê |
|-----------|-----------|-------|---------|
| Frontend | Next.js 14 + Tailwind | R$ 0 | SSR, SEO, performance |
| Backend | Next.js API + Edge Functions | R$ 0-50/mês | Zero-config, serverless |
| Banco | Supabase (PostgreSQL) | R$ 0 (500MB grátis) | Já configurado |
| Auth | SuperTokens | R$ 0 (5k usuários) | Open source, self-hosted |
| Pagamento | Stripe + Asaas | 2,9% + R$ 0,50 | Cartão + PIX/boleto |
| Domínio | registry.br | R$ 50/ano | .com.br |

## 📊 Fluxo do Usuário (MVP)

```
1. LANDING PAGE → vê planos R$37/R$57
2. CADASTRO → email + senha (SuperTokens)
3. TRIAL 7 DIAS → acesso completo ML
4. BUSCA → digita categoria/produto
5. RESULTADOS → lista de produtos com:
   ├── Preço médio
   ├── Score de demanda (1-10)
   ├── Tendência (↑ estável ↓)
   ├── Número de vendedores
   ├── Margem estimada
   └── Fornecedor sugerido
6. PAGAMENTO → cartão/PIX via Stripe/Asaas
7. USO CONTÍNUO → dashboard, alerts, favoritos
8. ACOMPANHAMENTO → histórico de preços, tendências
```

## 🗺️ Roadmap

| Fase | O que | Prazo |
|------|-------|-------|
| 🏁 **MVP** | Landing + cadastro + busca ML + pagamento | 2-3 semanas |
| 🚀 **V1.1** | Score IA + alerts + favoritos | Semana 4-5 |
| 🔥 **V1.2** | TikTok Shop + margem BR | Semana 6-8 |
| 🧩 **V2.0** | Extensão Chrome | Semana 8-10 |
| 🤖 **V2.1** | Agentes IA (logs, marketing) | Semana 10-12 |
| 🏢 **V3.0** | API + multi-usuário + white-label | Pós-validação |

## 📈 Métricas de Sucesso (Primeiros 3 Meses)

- ✅ Landing page no ar (semana 1)
- ✅ 50+ leads capturados (semana 2)
- ✅ 10+ trials ativos (semana 3)
- ✅ 3+ assinantes pagos (mês 1)
- ✅ 20+ assinantes pagos (mês 3)
- ✅ Churn < 5% mensal
- ✅ NPS > 50

## 🧑‍💼 Time

- **Enzo (CEO/Produto)** — Visão, estratégia, vendas
- **Hermes Agent (CTO interino)** — Arquitetura, desenvolvimento, agentes IA
- **Agentes IA (futuro)** — Automação de logs, marketing, suporte

---

*Documento criado em 23/07/2026 após pesquisa de mercado, análise de concorrência e Conselho de LLMs.*
