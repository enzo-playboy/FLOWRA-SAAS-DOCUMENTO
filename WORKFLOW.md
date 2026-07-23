# 🚀 SaaS Flowra — Workflow de Desenvolvimento

> **Regras:** Conselho de LLMs para decisões | C-Level para visão estratégica | PRD/Spec-first para construir | Git para histórico

---

## 🧠 Fluxo de Decisão

### 1. Toda decisão importante → Conselho de LLMs
Sempre que tiver uma decisão com algo em jogo:
- **Gatilhos:** "convoca o conselho", "war room", "stress-test", "valida isso", "devo fazer X ou Y"
- **Pra quê:** Posicionamento, precificação, roadmap, tradeoffs, risco vs oportunidade

### 2. Toda visão estratégica → C-Level Advisors
Use as skills de C-Level pra pensar como:
- **CEO** — Visão geral, estratégia, finanças, board
- **CTO/VPE** — Arquitetura, tech debt, escalabilidade
- **CPO** — Produto, roadmap, priorização
- **CMO** — Marketing, growth, posicionamento
- **CRO** — Revenue, vendas, pipeline

### 3. Toda feature → PRD + Spec-First Workflow

```
PROBLEMA → PRD (/prd) → SPEC (spec-driven-workflow) → CÓDIGO → TESTES
```

#### Fase 1: PRD (Product Requirements Document)
Usar o comando `/prd` do claude-skills:
1. **Problem** — Qual problema do usuário? Evidência?
2. **User** — Quem sente essa dor?
3. **Metric** — Qual número mede sucesso?
4. **Alternatives** — O que fazem hoje?
5. **Non-goals** — O que fica de fora da v1?

**Portão:** Só escreve o PRD se tiver problema, usuário E métrica definidos.

#### Fase 2: Spec (Especificação Técnica)
Usar a skill `spec-driven-workflow`:
- **FR-N** (Functional Requirements) com RFC 2119 (MUST/SHOULD/MAY)
- **NFR-N** (Non-Functional): performance, segurança, escalabilidade
- **Acceptance Criteria** em Given/When/Then
- **API Contracts** com interfaces TypeScript-style
- **Data Models** com campos, tipos, constraints
- **Edge Cases** numerados

**Regra de Ferro:** NENHUM CÓDIGO SEM SPEC APROVADA.

#### Fase 3: Implementação
- Seguir acceptance criteria da spec
- TDD onde aplicável
- Código sempre referenciando FR-N ou NFR-N

---

## 📁 Estrutura do Repositório

```
D:\saas flowra\
├── 📋 Índice - Skills Clonadas.md
├── 📁 .git/
├── 📁 llm-council-skill-ptbr/       # Conselho de LLMs
├── 📁 Sales-Skills/                  # Skills de vendas
├── 📁 claude-skills/                 # Biblioteca geral (362 skills)
├── 📁 pydantic-ai-skills/            # Contratos de dados rígidos
├── 📁 prd/                          # PRDs dos produtos ⭐
├── 📁 specs/                        # Especificações técnicas ⭐
└── 📁 src/                          # Código fonte ⭐
```

> ⭐ Pastas a serem criadas conforme formos construindo.

---

## 🛠️ Ferramentas

| Ferramenta | Uso |
|------------|-----|
| **LintLang** | `lintlang scan` — linter de prompts e configs de IA |
| **OneQuery CLI** | `onequery query` — consultar bancos de dados |
| **Pydantic AI Skills** | Contratos de dados entre agentes |
| **Git** | `git add + commit` — historiar tudo |

---

## ✅ Checklist por Sessão

- [ ] Decisões importantes foram pro **Conselho de LLMs**?
- [ ] Dimensão estratégica usou **C-Level advisors**?
- [ ] Feature nova tem **PRD** com problema + usuário + métrica?
- [ ] Spec foi escrita **ANTES** do código?
- [ ] Tudo foi commitado no **Git**?
