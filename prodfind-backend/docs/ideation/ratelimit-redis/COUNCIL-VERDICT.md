# Conselho de LLMs — Rate Limit via Redis (ProdFind)

**Pergunta enquadrada (25/07):** O rate limit das buscas (e rotas públicas) deve ficar por conta do Redis (Upstash, in-memory, compartilhado), para não deixar o site lento? Quais valores de limite? Fail-open ou fail-closed? Identificador IP ou user?

**Veredito final:** ✅ APROVADO o mecanismo (Redis in-memory compartilhado é a escolha certa p/ serverless — não adiciona latência perceptível). ⚠️ VALIDAR ANTES de fixar valores: os números propostos eram chutes; começar conservador + instrumentar + tunar. 5 correções críticas aplicadas.

## Resumo dos conselheiros
- **Contrário:** 8 falhas. As 3 fatais: (1) "<5ms" é enganoso ponta-a-ponta (10–150ms via REST) e Redis vira SPOF + custo por request; (2) limitar por IP no BR é falso positivo em massa (CGNAT) e inútil contra bots; (3) o token bucket protege teu compute, NÃO a cota compartilhada do ML — que é o ativo de risco.
- **Executor:** plano de 7 dias. `@upstash/ratelimit` + `@upstash/redis`, token bucket, topo de rota (não Edge), `identifier = userId ?? ip`, `timeout: 800ms` (fail-open embutido), `try/catch` defensivo. Ordem: fundação → checkout → webhook(assinatura) → alerts → saved-products → auth. Métricas: 429, p99, cache hit.
- **Cético de Dados:** números são chutes sem dados (pré-lançamento). O limite REAL do ML é o número que falta e é bloqueante. Exigiu 4 métricas antes de lançar e processo de calibração em 2 semanas. Web indisponível impediu confirmar limite oficial do ML → medição empírica obrigatória.

## Onde concordam
- Redis (in-memory, compartilhado) é o store correto para serverless — local per-instance estaria errado.
- Fail-open necessário (Redis down não derruba o site), mas assimétrico.
- Valores são hipóteses → começar folgado + observar + tunar, nunca hardcoded como dogma.
- Proteger a cota do ML é o objetivo existencial; cache é a 1ª linha.

## Onde discordam / tensões
- Contrário vs Executor: latência do Upstash (10–150ms) vs "seguro o suficiente" — resolvido com region pinning + fail-open + timeout.
- Expansionista (incorporado): há upside — limites anônimos conservadores viram funil de free tier; dados de rate limit alimentam abuse detection.
- Primeiros Princípios (incorporado): o recurso finito é a cota ML + compute serverless; logo precisa de guarda GLOBAL (app token) + limite por usuário, não por IP.

## Decisão final
**Build (mecanismo) + Validate first (valores).** Implementar rate limit via Upstash Redis agora, com:
1. Identificador `user_id` (auth) / composite hash (anon); nunca IP puro.
2. Dois limitadores: UX por usuário + guarda global do ML (app token).
3. Fail-open nos limites de UX (circuit breaker → LRU local); fail-closed na chamada ML.
4. Pinar região Upstash = Vercel (sa-east-1-1 / gru1).
5. Stripe: assinatura whsec, não IP allowlist.
6. `/api/auth/*` sobe para 20/min.
7. Instrumentar 429 / p99 / cache hit / ML 429 antes de lançar; tunar em 2 semanas.
8. **Bloqueante:** medir limite real do ML (carga até 429) antes de fixar a guarda global.

Atualizado em RFC-002 §7 e §13.
