# COUNCIL-VERDICT — ProdFind: Viabilidade da API do Mercado Livre

**Pergunta enquadrada:** Dadas as restrições recentes da API do ML (`/sites/MLB/search` 403; alegação não verificada de que `/items` de terceiro retorna 403 access_denied), o ProdFind (SaaS de descoberta de produtos vencedores por categoria) ainda é viável ou devemos pivotar/abandonar?

## Resumo dos Conselheiros

**O Contrário — ABORTAR.** O ProdFind é construído sobre um loophole: um app-token (`client_credentials`) lendo catálogo e vendas de vendedores terceiros via endpoints não-oficiais. O `/highlights` (core) também é não-oficial e pode ser fechado sem aviso. Se `/items` de terceiro nunca funcionar, não há "produto vencedor" (sem `sold_quantity`). O app-token pode ser revogado por violar termos de dev; 1 token + 1 IP residencial não escala para 442 usuários (fingerprint de abuso); ponto único de falha (token+IP+Enzo). Concorre diretamente com as próprias ferramentas pagas de inteligência do ML. C (degradado) é "morte disfarçada", não produto.

**O Cético de Dados — INCONCLUSIVO (exija o teste).** Não há dados suficientes para GO/NO-GO. Nossos próprios testes já refutam parcialmente a alegação (o `/products/{id}/items` retornou dado de terceiro com app-token). Historicamente `/items` é leitura PÚBLICA, tornando a alegação de 403 "improvável por design" — mas precisa de teste, não de fé. Não decidir sem rodar `test-items.mjs`. Framework A/B/C/D conforme o resultado real. A premissa "projeto morto" é infundada com os dados atuais. (Nota: ferramentas de web do ambiente estavam indisponíveis, então a verificação externa ficou pendente.)

**O Executor — VIÁVEL (construir já).** 80% do build não depende do teste (token, `/highlights`, cache, UI, billing, fallback C). Plano de 7 dias com marcos. Mesmo no cenário C (só ranking + preço + seller), o produto é vendável como inteligência de concorrência (benchmark de preço + concentração de vendedor). Risco real não é a API e sim o rate limit do app-token compartilhado → cache agressivo + warm cron desde o Dia 1.

**O Pensador de Primeiros Princípios (síntese do agente pai).** A necessidade real do usuário é "o que vende bem na categoria X" — o CORE é o RANKING (`/highlights` já entrega). `sold_quantity` por item é enriquecimento, não o produto. Reframe: o ProdFind é "ranking de best-sellers por categoria + benchmark de preço", não "vendas exatas por item". Isso torna C viável e reduz a dependência do `/items`.

**O Expansionista (síntese do agente pai).** Mesmo degradado, é uma wedge: "heatmaps de categoria" + benchmark de preço para agências (R$297). Upside adjacente: "achar gaps" (categorias com poucos vendedores = oportunidade), análise de spread de preço, e até monetizar a própria API de dados para outras ferramentas.

## Onde Concordam
- A evidência decisiva está FALTANDO: `test-items.mjs` não foi rodado. Todos dizem "não decidir sem o teste".
- `/highlights` funciona (CORE provado).
- `/products/{id}/items` lê terceiro com app-token (provado; refuta "só seus próprios").
- O risco real NÃO é "API morta" e sim (a) escala de 1 token/1 IP, (b) fragilidade de endpoints não-oficiais, (c) rate limits.

## Onde Discordam
- Contrário: ABORTAR (inviabilidade estrutural por loophole). Executor: VIÁVEL (MVP com risco aceitável + degradação). Cético: INCONCLUSIVO (depende do teste).
- Tensão central: construir sobre dado potencialmente revogável vale a pena para um MVP rápido e barato que gera receita enquanto se busca caminho mais defensável?

## Decisão Final: VALIDATE FIRST
Não abortar (temos core funcionando e nossa evidência refuta o "morto"), mas também não construir A às cegas.
1. RODAR `test-items.mjs` AGORA (gate A/B/C).
2. Independentemente do resultado: iniciar fundação Dia-1 (token + cache + `/highlights` + skeleton UI) — trabalho cego ao teste.
3. Arquitetar desde o Dia 1 para 1 app-token compartilhado + cache agressivo + warm cron (mitiga risco de escala do Contrário).
4. Tratar `/highlights` + `/products/{id}/items` como core ESTÁVEL; `/items` `sold_quantity` como enriquecimento com degradação graceful.
5. Construir moat defensável na CAMADA DE ANÁLISE (gaps, benchmarks, concentração de vendedor), não no pipe de dados bruto — sobrevive mesmo se o ML fechar.
