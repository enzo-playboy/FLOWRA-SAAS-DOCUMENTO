# 🚀 SaaS Flowra — Skills & Ferramentas

> **Data:** 22/07/2026  
> **Objetivo:** Base de conhecimento de skills para IA agents + ferramentas de desenvolvimento pro SaaS Flowra

---

## 📦 Skills-Clonadas

### 1. LLM Council Skill (PT-BR)
**Origem:** [gestordeaudiencia/llm-council-skill-ptbr](https://github.com/gestordeaudiencia/llm-council-skill-ptbr)  
**Pasta:** `llm-council-skill-ptbr/`  
**Descrição:** Skill que transforma uma pergunta em 5 opiniões de especialistas + veredito final. Baseada na metodologia LLM Council do Andrej Karpathy. Traduzida pro PT-BR.  
**Stack:** Claude Code / Claude Cowork

### 2. Sales Skills
**Origem:** [louisblythe/Sales-Skills](https://github.com/louisblythe/Sales-Skills)  
**Pasta:** `Sales-Skills/`  
**Descrição:** 20+ skills de vendas B2B para agentes de IA: prospecção, descoberta, negociação, fechamento, objeções, rapport, etc.  
**Stack:** Claude Code  
**Destaques:** `active-listening`, `closing`, `negotiation`, `objection-handling`, `discovery`, `follow-up-discipline`, `asking-effective-questions`, `competitive-positioning`, `storytelling`, `written-communication`

### 3. Claude Skills (362 Skills)
**Origem:** [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)  
**Pasta:** `claude-skills/`  
**Descrição:** **362 skills** — o maior repositório open-source de skills para coding agents. Cobre engenharia, DevOps, marketing, segurança, compliance, finanças, RH, produtividade, pesquisa, vendas e mais.  
**Stack:** Claude Code · OpenAI Codex · Gemini CLI · Cursor · Hermes Agent · Aider · Windsurf · Kilo Code · OpenCode · Antigravity  
**Categorias:** agents/, business-growth/, business-operations/, c-level-advisor/, commercial/, compliance-os/, commands/, custom-gpt/, engineering/, engineering-team/, finance/, marketing/, orchestration/, productivity/, product-team/, project-management/, ra-qm-team/, research/, research-ops/, standards/

### 4. Pydantic AI Skills
**Origem:** [DougTrajano/pydantic-ai-skills](https://github.com/DougTrajano/pydantic-ai-skills)  
**Pasta:** `pydantic-ai-skills/`  
**Descrição:** Framework padronizado e componível para construir skills de agentes no ecossistema Pydantic AI. Contratos de dados rígidos com tipos Python, validação automática, disclosure progressivo.  
**Stack:** Pydantic AI (Python 3.10+)  
**Instalação:** `pip install pydantic-ai-skills`

---

## 🛠️ Ferramentas Instaladas

### 5. LintLang — Linter de Config de IA
**Pacote:** `lintlang` (v0.3.1) via pip  
**Origem:** [Hermes Labs](https://github.com/hermes-labs-ai/lintlang)  
**Descrição:** Linter estático para configs de agentes de IA, descrições de ferramentas e system prompts. Análise estrutural H1-H7 com veredito PASS/REVIEW/FAIL. Zero-LLM CI gating.  
**Uso:**
```bash
lintlang scan arquivo.yaml          # Escanear configs
lintlang scan --patterns H1 H3      # Filtrar por padrões específicos
lintlang scan --format json --fail-on review  # CI mode
lintlang patterns                    # Listar todos os padrões
lintlang preflight                   # Inspecionar prompt antes do agente
```
**Padrões H1-H7:**
- H1: Tool Description Ambiguity
- H2: Missing Constraint Scaffolding
- H3: Schema-Intent Mismatch
- H4: Context Boundary Erosion
- H5: Implicit Instruction Failure
- H6: Template Format Contract Violation
- H7: Role Confusion

### 6. OneQuery CLI — Consulta de Bancos de Dados
**Pacote:** `@onequery/cli` (v0.1.65) via npm (global)  
**Site:** [onequery.dev](https://onequery.dev)  
**Descrição:** CLI para consultar bancos de dados conectados via OneQuery. Suporta múltiplos sources, autenticação, backup/restore e self-host gateway.  
**Comandos principais:**
```bash
onequery auth           # Gerenciar autenticação
onequery source         # Inspecionar fontes de dados disponíveis
onequery query          # Executar ou validar queries nos sources
onequery backup         # Criar backup do runtime state
onequery gateway        # Rodar self-host gateway
onequery doctor         # Diagnóstico do CLI
```

---

## 🎯 Como usar no SaaS Flowra

| Recurso | Pra quê |
|---------|---------|
| **Pydantic AI Skills** | Contratos de dados rígidos entre agentes e sistemas |
| **LintLang** | Garantir que prompts e configs dos agentes não têm vulnerabilidades |
| **OneQuery CLI** | Consultar bancos de dados dos clientes do SaaS |
| **LLM Council** | Decisões estratégicas multi-perspectiva |
| **Sales Skills** | Agente de vendas do SaaS Flowra |
| **Claude Skills** | Biblioteca geral de skills pra qualquer agente |

---

## 🔗 Links úteis

- [Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs)
- [pydantic-ai-skills Docs](https://dougtrajano.github.io/pydantic-ai-skills)
- [Agent Skills Spec](https://agentskills.io/home)
- [OneQuery](https://onequery.dev)
- [LintLang GitHub](https://github.com/hermes-labs-ai/lintlang)
