# Conselho de LLMs — RFC-003: Análise de Lucratividade + Fornecedores

**Data:** 26/07/2026
**Pergunta:** Devemos construir a integração de fornecedores + margem de lucro no ProdFind?

---

## Conselheiros

### 🔴 CONTRÁRIO (The Contrarian)
**Veredicto: NÃO CONSTRUIR (na forma atual)**

**Top 3 críticas:**
1. **CJ API é bomba-relógio** — preços "base" não incluem frete internacional, impostos (60%+), câmbio. Margem calculada vai estar SISTEMATICAMENTE ERRADA. Usuário pensa que tem 40%, na prática tem -5%.
2. **CNPJ ≠ Confiabilidade** — BrasilAPI só verifica dados cadastrais. Um golpista pode ter CNPJ ativo. Mostrar "Score: 85%" baseado em CNPJ é PERIGOSAMENTE ENGANOSO.
3. **ML Atacado API não existe** para consulta de preços de fornecedores. O RFC assume algo que não é verdade.

**Recomendação:** Validar manualmente com 20 produtos antes de codar. O Enzo pode testar pessoalmente em Cuiabá.

---

### 🟢 EXECUTOR (The Executor)
**Veredicto: CONSTRUIR MVP REDUZIDO**

**Análise técnica:**
| API | Viabilidade | Tempo |
|-----|-------------|-------|
| BrasilAPI (CNPJ) | ✅ Totalmente viável | 1 dia |
| CJ Dropshipping | ✅ Viável (conta verificada necessária) | 3-4 dias |
| ML Atacado | ❌ API não suporta uso proposto | N/A |

**Bloqueio crítico:** CJ precisa de conta verificada (KYC) — 3-7 dias úteis.

**Estimativa:** 5-7 dias com 1 dev sênior (sem ML Atacado).

**Recomendação:** Construir CJ + BrasilAPI apenas. ML Atacado fora do MVP.

---

### 🔵 CÉTICO DE DADOS (Data Skeptic)
**Veredicto: VALIDAR PRIMEIRO (2-4 semanas)**

**Críticas às métricas:**
- 30% usage é inflado (benchmark SaaS: 15-20% é bom)
- +15% conversão sem baseline = impossível projetar
- NPS > 8 mal definido

**O que falta validar:**
1. ML Atacado tem API ou não? (CRÍTICO)
2. Qual baseline atual do ProdFind?
3. Pesquisa com 30-50 vendedores reais
4. Testar CJ API em sandbox

**Recomendação:** Validar com mockup + entrevistas antes de código.

---

## Onde CONCORDAM

| Ponto | Consenso |
|-------|----------|
| **ML Atacado** | ❌ Todos concordam que a API não serve para o proposto |
| **BrasilAPI** | ✅ Todos concordam que é viável e gratuita |
| **CJ API** | ⚠️ Viável mas com ressalvas (preços podem ser imprecisos) |
| **Validação** | Todos querem validação antes de código completo |

## Onde DISCORDAM

| Ponto | Contrário | Executor | Cético |
|-------|-----------|----------|--------|
| **Ação** | Não construir | Construir MVP | Validar primeiro |
| **Risco jurídico** | Alto (intermediário de confiança) | Não mencionado | Não mencionado |
| **Prazo** | N/A | 5-7 dias | 2-4 semanas |

---

## SÍNTESE FINAL

### Recomendação do Conselho: **VALIDAR → MVP REDUZIDO**

**Fase 1: Validação (1 semana)**
1. Enzo cria conta CJ → inicia verificação KYC (3-7 dias)
2. Testa CJ API com 5 produtos reais → confirma se preços batem
3. Valida BrasilAPI com 10 CNPJs reais
4. Pergunta pra 10 vendedores ML: "Vocês buscam fornecedores?"

**Fase 2: MVP (se validado, 1 semana)**
- ✅ BrasilAPI (CNPJ verificação)
- ✅ CJ Dropshipping (fornecedor principal)
- ✅ Cálculo de margem (com DISCLAMER gigante)
- ❌ ML Atacado (API não existe pro uso proposto)
- ❌ Serasa/Boa Vista (premium, futuro)

**Disclaimer obrigatório no frontend:**
> "Margem é ESTIMATIVA. Considere frete internacional, impostos e câmbio. O ProdFind não garante entrega por fornecedores."

### Decisão: **BUILD SMALL** (com validação prévia)

---

*Conselho composto por: Contrário, Executor, Cético de Dados*
*26/07/2026*
