---

name: llm-council


description: "Passa qualquer pergunta, ideia ou decisão por um conselho de 5 conselheiros de IA que analisam de forma independente, fazem revisão por pares anonimamente, e sintetizam um veredito final. Baseado na metodologia LLM Council do Karpathy. GATILHOS OBRIGATÓRIOS (PT-BR): 'convoca o conselho', 'roda o conselho', 'leva pro conselho', 'submete ao conselho', 'war room isto', 'stress-test isto', 'pressure-test isto', 'debate isto'. GATILHOS OBRIGATÓRIOS (inglês): 'council this', 'run the council', 'war room this', 'pressure-test this', 'stress-test this', 'debate this'. GATILHOS FORTES (use quando combinados com uma decisão real ou tradeoff): 'devo fazer X ou Y', 'qual opção', 'o que você faria', 'é a jogada certa', 'valida isso', 'me dá várias perspectivas', 'não consigo decidir', 'estou dividido entre', 'should I X or Y', 'which option', 'what would you do', 'is this the right move', 'validate this', 'get multiple perspectives'. NÃO dispare em perguntas simples de sim/não, buscas factuais, ou 'devo X' casual sem tradeoff relevante (ex: 'devo usar markdown' não é pergunta pra conselho). DISPARE quando o usuário apresenta uma decisão genuína com algo em jogo, múltiplas opções, e contexto que sugere que ele quer pressionar o problema por vários ângulos."

---


# Conselho de LLMs


Você pergunta uma coisa pra uma IA, recebe uma resposta. Essa resposta pode ser ótima. Pode ser mediana. Você não tem como saber, porque só viu uma perspectiva.


O conselho resolve isso. Ele passa a sua pergunta por 5 conselheiros independentes, cada um pensando a partir de um ângulo fundamentalmente diferente. Depois eles revisam o trabalho uns dos outros. Depois um presidente sintetiza tudo numa recomendação final que te diz onde os conselheiros concordam, onde se chocam, e o que você deve realmente fazer.


Isto foi adaptado do LLM Council do Andrej Karpathy. Ele despacha as queries pra múltiplos modelos, faz com que façam revisão por pares anonimamente, e então um presidente produz a resposta final. Aqui dentro do Claude fazemos a mesma coisa usando sub-agentes com lentes de pensamento diferentes em vez de modelos diferentes.


---


## quando rodar o conselho


O conselho é pra perguntas em que estar errado é caro.


Boas perguntas pra levar ao conselho:

- "Devo lançar um workshop de R$ 97 ou um curso de R$ 497?"

- "Qual desses 3 ângulos de posicionamento é o mais forte?"

- "Estou pensando em pivotar de X pra Y. Tô louco?"

- "Aqui está a copy da minha landing page. O que está fraco?"

- "Devo contratar uma VA ou construir uma automação primeiro?"


Perguntas ruins pra levar ao conselho:

- "Qual é a capital da França?" (uma resposta certa, não precisa de várias perspectivas)

- "Escreve um tweet pra mim" (tarefa de criação, não decisão)

- "Resume esse artigo" (tarefa de processamento, não julgamento)


O conselho brilha quando há incerteza genuína e o custo de uma escolha errada é alto. Se você já sabe a resposta e só quer validação, o conselho provavelmente vai te dizer coisas que você não quer ouvir. Esse é o ponto.


---


## os cinco conselheiros


Cada conselheiro pensa a partir de um ângulo diferente. Não são cargos nem personas. São estilos de pensamento que naturalmente criam tensão entre si.


### 1. O Contrário (The Contrarian)

Procura ativamente o que está errado, o que está faltando, o que vai falhar. Assume que a ideia tem uma falha fatal e tenta encontrá-la. Se tudo parece sólido, ele cava mais fundo. O Contrário não é um pessimista. É o amigo que te salva de um mau negócio fazendo as perguntas que você está evitando.


### 2. O Pensador de Primeiros Princípios (The First Principles Thinker)

Ignora a pergunta de superfície e pergunta "o que estamos realmente tentando resolver aqui?". Tira as suposições. Reconstrói o problema do zero. Às vezes o output mais valioso do conselho é o Pensador de Primeiros Princípios dizendo "você está fazendo a pergunta errada por completo."


### 3. O Expansionista (The Expansionist)

Procura o upside que todo mundo está perdendo. O que poderia ser maior? Que oportunidade adjacente está escondida? O que está sendo subvalorizado? O Expansionista não liga pro risco (esse é o trabalho do Contrário). Ele liga pro que acontece se isso funcionar até melhor do que o esperado.


### 4. O Forasteiro (The Outsider)

Não tem contexto nenhum sobre você, sua área, ou sua história. Responde puramente ao que está na frente dele. Este é o conselheiro mais subestimado. Especialistas desenvolvem pontos cegos. O Forasteiro pega a maldição do conhecimento: coisas que são óbvias pra você mas confusas pra todo mundo.


### 5. O Executor (The Executor)

Só liga pra uma coisa: isso pode ser feito de fato, e qual é o caminho mais rápido pra fazer? Ignora teoria, estratégia e pensamento de panorama. O Executor olha cada ideia pela lente de "OK, mas o que você faz na segunda-feira de manhã?". Se uma ideia parece brilhante mas não tem um primeiro passo claro, o Executor vai dizer.


**Por que esses cinco:** Eles criam três tensões naturais. Contrário vs Expansionista (downside vs upside). Primeiros Princípios vs Executor (repensar tudo vs simplesmente fazer). O Forasteiro fica no meio mantendo todo mundo honesto, vendo o que olhos novos veem.


---


## como uma sessão de conselho funciona


### passo 1: enquadrar a pergunta (com enriquecimento de contexto)


Quando o usuário disser "convoca o conselho" (ou qualquer frase-gatilho), faça duas coisas antes de enquadrar:


**A. Escaneie o workspace por contexto.** A pergunta do usuário geralmente é só a ponta do iceberg. O setup do Claude dele provavelmente contém arquivos que melhorariam dramaticamente o output do conselho. Antes de enquadrar, escaneie e leia rapidamente quaisquer arquivos de contexto relevantes:


- `CLAUDE.md` ou `claude.md` na raiz do projeto ou workspace (contexto do negócio, preferências, restrições)

- Qualquer pasta `memory/` (perfis de audiência, documentos de voz, detalhes do negócio, decisões passadas)

- Quaisquer arquivos que o usuário referenciou explicitamente ou anexou

- Transcrições recentes de conselho nesta pasta (pra evitar reconvocar o mesmo terreno)

- Quaisquer outros arquivos de contexto que pareçam relevantes pra pergunta específica (ex: se ele está perguntando sobre preço, procure por dados de receita, resultados de lançamentos passados, pesquisa de audiência)


Use `Glob` e `Read` rápidos pra encontrar isso. Não gaste mais de 30 segundos. Você está procurando os 2-3 arquivos que dariam aos conselheiros o contexto necessário pra dar conselhos específicos e fundamentados em vez de tomadas genéricas.


**B. Enquadre a pergunta.** Pegue a pergunta crua do usuário E o contexto enriquecido e reformule como um prompt claro e neutro que todos os cinco conselheiros vão receber. A pergunta enquadrada deve incluir:


1. A decisão ou pergunta central

2. Contexto-chave da mensagem do usuário

3. Contexto-chave dos arquivos do workspace (estágio do negócio, audiência, restrições, resultados passados, números relevantes)

4. O que está em jogo (por que esta decisão importa)


Não adicione sua opinião. Não direcione. Mas GARANTA que cada conselheiro tem contexto suficiente pra dar uma resposta específica e fundamentada em vez de conselho genérico.


Se a pergunta for vaga demais ("convoca o conselho: meu negócio"), faça uma única pergunta de esclarecimento. Só uma. Depois prossiga.


Salve a pergunta enquadrada pra transcrição.


### passo 2: convocar o conselho (5 sub-agentes em paralelo)


Convoque todos os 5 conselheiros simultaneamente como sub-agentes. Cada um recebe:


1. Sua identidade de conselheiro e estilo de pensamento (das descrições acima)

2. A pergunta enquadrada

3. Uma instrução clara: responda independentemente. Não hesite. Não tente ser equilibrado. Se incline totalmente pra perspectiva atribuída. Se enxergar uma falha fatal, fale. Se enxergar upside massivo, fale. Seu trabalho é representar seu ângulo da forma mais forte possível. A síntese vem depois.


Cada conselheiro deve produzir uma resposta de 150-300 palavras. Longa o suficiente pra ser substantiva, curta o suficiente pra ser escaneável.


**Template de prompt do sub-agente:**


```

Você é [Nome do Conselheiro] em um Conselho de LLMs.


Seu estilo de pensamento: [descrição do conselheiro acima]


Um usuário trouxe esta pergunta ao conselho:


---

[pergunta enquadrada]

---


Responda a partir da sua perspectiva. Seja direto e específico. Não hesite nem tente ser equilibrado. Incline-se totalmente pro ângulo atribuído. Os outros conselheiros vão cobrir os ângulos que você não está cobrindo.


Mantenha sua resposta entre 150-300 palavras. Sem preâmbulo. Vá direto pra análise.

```


### passo 3: revisão por pares (5 sub-agentes em paralelo)


Este é o passo que faz o conselho ser mais do que "perguntar 5 vezes". É o núcleo do insight do Karpathy.


Colete todas as 5 respostas dos conselheiros. Anonimize-as como Resposta A até E (randomize qual conselheiro mapeia pra qual letra pra não haver viés posicional).


Convoque 5 novos sub-agentes, um pra cada conselheiro. Cada revisor vê todas as 5 respostas anonimizadas e responde três perguntas:


1. Qual resposta é a mais forte e por quê? (escolha uma)

2. Qual resposta tem o maior ponto cego e qual é?

3. O que TODAS as respostas perderam que o conselho deveria considerar?


**Template de prompt do revisor:**


```

Você está revisando os outputs de um Conselho de LLMs. Cinco conselheiros responderam independentemente a esta pergunta:


---

[pergunta enquadrada]

---


Aqui estão as respostas anonimizadas:


**Resposta A:**

[resposta]


**Resposta B:**

[resposta]


**Resposta C:**

[resposta]


**Resposta D:**

[resposta]


**Resposta E:**

[resposta]


Responda estas três perguntas. Seja específico. Referencie as respostas por letra.


1. Qual resposta é a mais forte? Por quê?

2. Qual resposta tem o maior ponto cego? O que está faltando?

3. O que TODAS as cinco respostas perderam que o conselho deveria considerar?


Mantenha sua revisão abaixo de 200 palavras. Seja direto.

```


### passo 4: síntese do presidente


Este é o passo final. Um agente recebe tudo: a pergunta original, todas as 5 respostas dos conselheiros (agora desanonimizadas pra você ver quem disse o quê), e todas as 5 revisões por pares.


O trabalho do presidente é produzir o output final do conselho. Ele segue esta estrutura:


**VEREDITO DO CONSELHO**


1. **Onde o conselho concorda** — os pontos em que múltiplos conselheiros convergiram independentemente. Estes são sinais de alta confiança.


2. **Onde o conselho se choca** — as discordâncias genuínas. Não suavize. Apresente os dois lados e explique por que conselheiros razoáveis discordam.


3. **Pontos cegos que o conselho pegou** — coisas que só emergiram através da rodada de revisão por pares. Coisas que conselheiros individuais perderam e que outros conselheiros sinalizaram.


4. **A recomendação** — uma recomendação clara e acionável. Não "depende". Não "considere os dois lados". Uma resposta de verdade. O presidente pode discordar da maioria se o raciocínio sustentar.


5. **A única coisa que você deve fazer primeiro** — um único próximo passo concreto. Não uma lista de 10 coisas. Uma coisa.


**Template de prompt do presidente:**


```

Você é o Presidente de um Conselho de LLMs. Seu trabalho é sintetizar o trabalho de 5 conselheiros e suas revisões por pares em um veredito final.


A pergunta trazida ao conselho:

---

[pergunta enquadrada]

---


RESPOSTAS DOS CONSELHEIROS:


**O Contrário:**

[resposta]


**O Pensador de Primeiros Princípios:**

[resposta]


**O Expansionista:**

[resposta]


**O Forasteiro:**

[resposta]


**O Executor:**

[resposta]


REVISÕES POR PARES:

[todas as 5 revisões por pares]


Produza o veredito do conselho usando esta estrutura exata:


## Onde o Conselho Concorda

[Pontos em que múltiplos conselheiros convergiram independentemente. São sinais de alta confiança.]


## Onde o Conselho se Choca

[Discordâncias genuínas. Apresente os dois lados. Explique por que conselheiros razoáveis discordam.]


## Pontos Cegos que o Conselho Pegou

[Coisas que só emergiram através da revisão por pares. Coisas que conselheiros individuais perderam e que outros sinalizaram.]


## A Recomendação

[Uma recomendação clara e direta. Não "depende". Uma resposta de verdade com raciocínio.]


## A Única Coisa a Fazer Primeiro

[Um único próximo passo concreto. Não uma lista. Uma coisa.]


Seja direto. Não hesite. O ponto inteiro do conselho é dar ao usuário uma clareza que ele não conseguiria de uma única perspectiva.

```


### passo 5: apresente o veredito no chat


Depois que a síntese do presidente estiver completa, apresente o veredito completo diretamente no chat usando markdown. NÃO gere um relatório HTML nem nenhum arquivo. O usuário lê na conversa.


Formate o output assim:


```

## Veredito do Conselho: {tópico curto}


### Onde o Conselho Concorda

{conteúdo}


### Onde o Conselho se Choca

{conteúdo}


### Pontos Cegos que o Conselho Pegou

{conteúdo}


### A Recomendação

{conteúdo}


### A Única Coisa a Fazer Primeiro

{conteúdo}

```


Mantenha escaneável. Use bullet points. Inclua os exemplos de antes/depois quando relevante.


### passo 6: salve a transcrição (opcional)


Salve uma transcrição apenas se o usuário pedir ou se a pergunta for significativa o suficiente pra referenciar depois. Se salvar, escreva em `council-transcript-[timestamp].md` no diretório `active/` do projeto.


---


## exemplo: convocando o conselho sobre uma decisão de produto


**Usuário:** "Convoca o conselho: estou pensando em construir um curso de R$ 297 sobre Claude Code pra iniciantes. Minha audiência é majoritariamente de solopreneurs não-técnicos. É a jogada certa?"


**O Contrário:** "O mercado está inundado de cursos sobre Claude agora. A R$ 297, você está competindo com conteúdo gratuito do YouTube. Sua audiência é não-técnica, o que significa alta carga de suporte e risco de reembolso. As pessoas que pagariam R$ 297 provavelmente já passaram do nível iniciante..."


**O Pensador de Primeiros Princípios:** "O que você está realmente tentando alcançar? Se for receita, um curso é um dos caminhos mais lentos. Se for autoridade, um recurso gratuito faria mais. Se for construir uma base de clientes pra ofertas de ticket maior, o ponto de preço e a audiência podem estar descalibrados..."


**O Expansionista:** "Claude pra iniciantes solopreneurs é um mercado massivo subatendido. Todo mundo está ensinando coisa avançada. Se você acertar o ângulo iniciante, você possui o ponto de entrada desse espaço inteiro. Os R$ 297 podem estar baixos. E se isso virasse um programa de R$ 997 com acesso a comunidade..."


**O Forasteiro:** "Eu não sei o que é Claude Code. Se eu visse 'curso de R$ 297 sobre Claude Code pra iniciantes', eu não saberia se é pra mim. O nome não significa nada pra alguém fora do seu mundo. Sua landing page precisa vender o resultado, não a ferramenta..."


**O Executor:** "Um curso completo leva 4-8 semanas pra produzir direito. Antes de construir qualquer coisa, rode um workshop ao vivo de R$ 97 pra 50 pessoas. Você valida demanda, gera depoimentos, e cria a matéria-prima do curso. Se 50 pessoas não comprarem o workshop, 500 não vão comprar o curso..."


**Veredito do Presidente:**


*Onde o conselho concorda:* O ângulo solopreneur iniciante tem demanda real, mas o enquadramento atual (curso de Claude Code) é específico demais pra ferramenta e não vai ressoar com compradores não-técnicos.


*Onde o conselho se choca:* Preço. O Contrário diz que R$ 297 é alto demais dada a competição. O Expansionista diz que é baixo demais pro valor. A resolução provavelmente depende de quanto suporte e acesso a comunidade vem incluído.


*Pontos cegos pegos:* O ponto do Forasteiro de que "Claude Code" não significa nada pro comprador-alvo é o insight mais importante. Todo conselheiro exceto o Forasteiro presumiu que a audiência já sabe o que é isso.


*Recomendação:* Não construa o curso ainda. Valide com uma oferta de menor compromisso primeiro. Mas reformule por completo: venda o resultado (automatize seu negócio, recupere 10 horas por semana), não a ferramenta.


*Única coisa a fazer primeiro:* Rode um workshop ao vivo de R$ 97 chamado "Como automatizar a primeira tarefa do seu negócio com IA" pra 50 pessoas. Não mencione Claude Code no título.


---


## notas importantes


- **Sempre convoque os 5 conselheiros em paralelo.** Convocação sequencial desperdiça tempo e deixa respostas anteriores vazarem pras posteriores.


- **Sempre anonimize pra revisão por pares.** Se os revisores souberem qual conselheiro disse o quê, eles vão se curvar a certos estilos de pensamento em vez de avaliar pelo mérito.


- **O presidente pode discordar da maioria.** Se 4 de 5 conselheiros disserem "faz" mas o raciocínio do 1 dissidente for o mais forte, o presidente deve ficar com o dissidente e explicar por quê.


- **Não convoque o conselho pra perguntas triviais.** Se o usuário perguntar algo com uma resposta certa, simplesmente responda. O conselho é pra incerteza genuína em que múltiplas perspectivas agregam valor.


- **O relatório visual importa.** A maioria dos usuários vai escanear o relatório, não ler a transcrição completa. Mantenha o output HTML limpo e escaneável.


---


## Créditos


- **Conceito original (LLM Council):** [Andrej Karpathy](https://github.com/karpathy/llm-council)
- **Adaptação como Claude Skill:** [Ole Lehmann](https://x.com/itsolelehmann)
- **Empacotamento original em GitHub:** [aiwithremy](https://github.com/aiwithremy/claude-skills-llm-council)
- **Tradução e adaptação para PT-BR:** [Daniel Feitosa (@gestordeaudiencia)](https://github.com/gestordeaudiencia) — [Cloud Coding Brasil](https://cloudcoding.com.br)
