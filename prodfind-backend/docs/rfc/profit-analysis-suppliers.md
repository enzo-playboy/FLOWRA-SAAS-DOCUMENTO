# RFC-003 — Análise de Lucratividade + Fornecedores Confiáveis

- **Status:** Draft
- **Autor:** Hermes (com Enzo)
- **Relacionado:** Feature "Profit Analysis" do ProdFind
- **Data:** 26/07/2026

---

## 1. Contexto

O ProdFind hoje mostra **O QUE está vendendo** (trending, filtros, categorias), mas não mostra **ONDE comprar** com confiança para revender. O cliente vê "Galaxy A17 vende muito" mas não sabe:
- Tem fornecedor no Brasil?
- O fornecedor da China é confiável?
- Qual a margem de lucro real?

**Problema:** Mostrar produtos sem sourcing completos é informativo mas não acionável. O cliente precisa de confiança pra tomar decisão.

## 2. Objetivos

1. **Mostrar fornecedores confiáveis** com dados reais (não links genéricos)
2. **Calcular margem de lucro** automaticamente (preço ML - custo fornecedor - taxas)
3. **Verificar credibilidade** do fornecedor (CNPJ, avaliação, tempo de empresa)
4. **Diferenciar** o ProdFind de ferramentas que só mostram trending

## 3. Não-objetivos

- Ser marketplace de fornecedores (não vender produtos)
- Garantir transações entre cliente e fornecedor
- Substituir due diligence do cliente
- Fornecedores Paraguai (sem API pública, escopo futuro)

## 4. Pesquisa de APIs (Validada 26/07)

### Tier 1 — Imediata (Gratuitas)

| API | Dados | Rate Limit | Custo |
|-----|-------|------------|-------|
| **BrasilAPI** | CNPJ: razão social, status, endereço, sócios | ~3 req/min | Gratuito |
| **Mercado Livre API** | Produtos, preços, reputação vendedores | 50-2000 req/min | Gratuito |
| **CJ Dropshipping API** | Catálogo, preços compra, estoque, fornecedores, envio | 1000/dia | Gratuito |

### Tier 2 — Complementar

| API | Dados | Custo |
|-----|-------|-------|
| **ReceitaWS** | Backup CNPJ | Free tier |
| **Alibaba API** | Fornecedores internacionais verificados | Gratuito básico |
| **OpenCorporates** | Validação global empresas | Gratuito limitado |

### Tier 3 — Premium (futuro)

| API | Dados | Custo |
|-----|-------|-------|
| **Serasa Empresas** | Score crédito, protestos | R$99+/mês |
| **Dun & Bradstreet** | Verificação global enterprise | Planos altos |

### Paraguai ⚠️

- **NÃO existe API pública** confiável
- DGI (RUC) disponível apenas via consulta web manual
- **Decisão:** Fora do escopo MVP; considerar due diligence local no futuro

## 5. Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                     ProdFind Frontend                        │
│  "Galaxy A17 - R$1.239 no ML"                              │
│  ├── 🇨🇳 CJ: R$450 | ⏱️ 20-30d | ⭐ 4.2/5              │
│  ├── 🇧🇷 BR (ML Atacado): R$650 | ⏱️ 3-7d | ⭐ 4.5/5   │
│  └── 💰 Margem: 35-47%                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│                   ProdFind Backend                           │
│                                                              │
│  /api/profit-analysis?productId=MLB54982411                  │
│    │                                                         │
│    ├── ml-highlights.ts (preço ML) ← já existe              │
│    ├── suppliers.ts (NOVO)                                   │
│    │   ├── CJ: busca por nome/produto                       │
│    │   ├── ML Atacado: busca vendedores BR                  │
│    │   └── Cache 24h (rate limit CJ: 1000/dia)              │
│    ├── verify.ts (NOVO)                                      │
│    │   └── BrasilAPI: valida CNPJ do fornecedor             │
│    └── margin.ts (NOVO)                                      │
│        └── Calcula: ML price - supplier cost - ML fees       │
└─────────────────────────────────────────────────────────────┘
```

## 6. Design Detalhado

### 6.1 Endpoint: `/api/suppliers`

```
GET /api/suppliers?productName=Samsung+Galaxy+A17&category=MLB1055

Response:
{
  "product": "Samsung Galaxy A17",
  "suppliers": [
    {
      "source": "cj",
      "name": "CJ Dropshipping",
      "url": "https://cjdropshipping.com/product/...",
      "price_cny": 450,
      "price_brl": 620,  // câmbio em tempo real
      "shipping_days": "20-30",
      "trust_score": 4.2,
      "verified": true,
      "location": "China"
    },
    {
      "source": "ml_atacado",
      "name": "Tech Distribuidora",
      "cnpj": "12.345.678/0001-90",
      "url": "https://mercadolivre.com.br/...",
      "price_brl": 650,
      "shipping_days": "3-7",
      "trust_score": 4.5,
      "verified": true,  // CNPJ validado
      "location": "São Paulo - SP"
    }
  ],
  "ml_price": 1239,
  "margins": [
    { "supplier": "cj", "margin_percent": 47.5 },
    { "supplier": "ml_atacado", "margin_percent": 42.8 }
  ]
}
```

### 6.2 Módulo: `lib/suppliers.ts`

- `searchCJ(productName)` — busca produto no CJ, retorna preço + fornecedor
- `searchMLAtacado(category)` — busca vendedores BR com reputação alta
- `verifyCNPJ(cnpj)` — valida empresa via BrasilAPI
- `getExchangeRate()` — câmbio BRL/CNY em tempo real (cache 1h)

### 6.3 Módulo: `lib/margin.ts`

```
Margem = (ML Price - Supplier Cost - ML Fees) / ML Fees × 100

ML Fees (estimativa):
- Comissão: 11-16% (varia por categoria)
- Frete grátis ML: ~R$15-30
- Custo fixo: ~R$5 por venda
```

### 6.4 Cache e Rate Limits

| Fonte | Rate Limit | Cache | Estratégia |
|-------|------------|-------|------------|
| CJ API | 1000/dia | 24h | Busca por produto, salva resultado |
| BrasilAPI | ~3/min | 7 dias | CNPJ não muda rápido |
| ML API | 50-2000/min | 1h | Preços mudam mais |
| ExchangeRate | Ilimitado | 1h | Variação lenta |

### 6.5 Segurança

- **Não armazenamos dados de pagamento** do fornecedor
- **Links são diretos** — cliente vai pro site do fornecedor
- **CNPJ validado** — apenas fornecedores com empresa ativa
- **Score de confiança** — baseado em dados reais, não inventado
- **Disclaimer:** "Margem é estimativa. Valide com fornecedor antes de comprar."

## 7. Frontend (O que o cliente vê)

### Card de Produto (expandido)

```
┌────────────────────────────────────────────────┐
│ 📱 Galaxy A17 - R$1.239 no ML                 │
│ Posição: #1 em Celulares                       │
│                                                 │
│ ┌──────────────────────────────────────────────┐│
│ │ 💰 ANÁLISE DE LUCRATIVIDADE                 ││
│ │                                              ││
│ │ Fornecedor    Custo    Frete   Margem       ││
│ │ 🇨🇳 CJ        R$620    R$35    47.5% ✅    ││
│ │ 🇧🇷 BR        R$650    R$15    42.8% ✅    ││
│ │                                              ││
│ │ ⚠️ Margem estimada. Valide antes de comprar.││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ [Ver no ML] [Buscar no CJ] [Ver fornecedor BR] │
└────────────────────────────────────────────────┘
```

## 8. Alternativas Consideradas

| Alternativa | Prós | Contras | Decisão |
|-------------|------|---------|---------|
| **Apenas links** (sem API) | Fácil, rápido | Sem dados reais, sem confiança | ❌ Rejeitado |
| **CJ + ML Atacado** | Dados verificados, APIs gratuitas | Só dois fornecedores | ✅ MVP |
| **+ Alibaba** | Mais fornecedores internacionais | API mais complexa | 🔄 Tier 2 |
| **+ Serasa** | Score crédito real | Custo R$99+/mês | 🔄 Tier 3 |
| **Paraguai** | Mercado enorme | Sem API, sem dados | ❌ Fora do escopo |

## 9. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| CJ muda API | Documentar, manter fallback sem suppliers |
| Preço CJ não reflete realidade | Disclaimer claro, "estimativa" |
| Fornecedor bomba | Validação CNPJ + score + review |
| Rate limit estoura | Cache agressivo 24h |
| Câmbio flutua | Cache 1h, mostrar "preço em R$ na data X" |

## 10. Métricas de Sucesso

| Métrica | Target | Como medir |
|---------|--------|------------|
| Uso da feature | 30% dos usuários clicam em "ver fornecedores" | Analytics |
| Conversão | Aumento de 15% em "buscar no ML" (ação) | Funil |
| Retorno | Usuários voltam pra ver mais produtos | Cohort |
| NPS | "ProdFind me ajudou a escolher o que vender" > 8 | Survey |

## 11. Escopo MVP

### Fase 1 (MVP — 2 semanas)
- [ ] `lib/suppliers.ts` — busca CJ + ML Atacado
- [ ] `lib/margin.ts` — cálculo de margem
- [ ] `lib/verify.ts` — validação CNPJ (BrasilAPI)
- [ ] `/api/suppliers` — endpoint único
- [ ] Frontend: card de lucratividade no produto
- [ ] Cache 24h + rate limit

### Fase 2 (pós-MVP)
- [ ] Alibaba API (mais fornecedores)
- [ ] Histórico de preços fornecedor
- [ ] Alerta de "preço baixou no fornecedor"

### Fase 3 (futuro)
- [ ] Serasa/Boa Vista (score crédito)
- [ ] Paraguai (due diligence manual)
- [ ] Integração com pagamento (comprar direto)

## 12. Perguntas em Aberto

1. **CJ Dropshipping:** Precisa de conta verificada pra API? (Pesquisar)
2. **ML Atacado:** Tem API ou é scraping? (Validar)
3. **Câmbio:** Usar API pública (economia.awesome) ou outro?
4. **Taxas ML:** Tabela oficial de comissões por categoria (atualizar)
5. **Frontend:** Onde exibir? Na página do produto ou modal?

## 13. Próximo

Aprovar RFC → **Conselho de LLMs** (validar viabilidade) → **Spec** → código.
