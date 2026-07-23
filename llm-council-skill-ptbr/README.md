# Conselho de LLMs (LLM Council)

Uma Claude Skill que transforma uma única pergunta em cinco opiniões de especialistas, mais um veredito final.

Criada por [Ole Lehmann](https://x.com/itsolelehmann). Baseada na metodologia [LLM Council](https://github.com/karpathy/llm-council) do Andrej Karpathy.

Funciona no **Claude Code** e no **Claude Cowork** (claude.ai).

> Tradução para PT-BR por [Daniel Feitosa (@gestordeaudiencia)](https://github.com/gestordeaudiencia). Versão original em inglês: [aiwithremy/claude-skills-llm-council](https://github.com/aiwithremy/claude-skills-llm-council).

---

## *O que é GitHub?*

Pensa no GitHub como um Google Drive, mas pra código. Em vez de compartilhar fotos e arquivos, as pessoas usam o GitHub pra compartilhar código e snippets como esta skill. Você está numa página do GitHub agora mesmo.

---

## O que é uma skill?

Uma skill é um pequeno conjunto de instruções que você dá pra sua IA. Pensa nela como uma descrição de cargo pra uma tarefa específica. Uma vez instalada, você dispara ela com uma frase e o Claude já sabe exatamente como lidar.

Esta skill em particular ensina o Claude a rodar um "conselho" pra você. Quando você faz uma pergunta difícil ou enfrenta uma decisão complicada, o Claude convoca 5 conselheiros diferentes que pensam sobre o problema a partir de ângulos fundamentalmente diferentes, fazem revisão por pares dos pontos uns dos outros, e entregam uma resposta final sintetizada.

---

## O que ela faz

Você pergunta uma coisa pra uma IA, recebe uma resposta. Essa resposta pode ser ótima. Pode ser mediana. Você não tem como saber, porque só viu uma perspectiva.

O conselho resolve isso. Ele passa a sua pergunta por 5 conselheiros independentes, cada um pensando a partir de um ângulo diferente. Eles revisam o trabalho uns dos outros. Um presidente sintetiza tudo numa recomendação final que te diz onde os conselheiros concordam, onde se chocam, e o que você deve realmente fazer.

---

## Quando usar

Boas perguntas pra levar pro conselho:

- "Devo lançar um workshop de R$ 97 ou um curso de R$ 497?"
- "Qual desses 3 ângulos de posicionamento é o mais forte?"
- "Estou pensando em pivotar de X pra Y. Tô louco?"
- "Aqui está a copy da minha landing page. O que está fraco?"
- "Devo contratar uma VA ou construir uma automação primeiro?"

Perguntas ruins pra levar pro conselho:

- "Qual é a capital da França?" (uma resposta certa, não precisa de várias perspectivas)
- "Escreve um tweet pra mim" (tarefa de criação, não decisão)
- "Resume esse artigo" (tarefa de processamento, não julgamento)

O conselho brilha quando há incerteza genuína e o custo de uma escolha errada é alto. Se você já sabe a resposta e só quer validação, o conselho provavelmente vai te dizer coisas que você não quer ouvir. Esse é o ponto.

---

## Como instalar (sem precisar de terminal)

Escolhe a opção que te parecer mais fácil. Ambas funcionam no Claude Code e no Claude Cowork.

### Opção 1: Deixa o Claude instalar pra você

Abre um chat novo no Claude e cola isto:

> Por favor, instala esta Claude skill pra mim. O arquivo SKILL.md mora neste repositório do GitHub: https://github.com/gestordeaudiencia/llm-council-skill-ptbr
>
> Configura tudo pra eu já poder usar. Me avisa qualquer coisa que precisar de mim.

O Claude vai buscar o arquivo e colocar no lugar certo. Se ele não conseguir fazer automaticamente (algumas configurações exigem upload manual), ele vai te dizer exatamente onde clicar.

### Opção 2: Baixa o arquivo e pede pro Claude configurar

1. Clica em [SKILL.md](./SKILL.md) no topo deste repositório.
2. Clica no botão de download no lado direito da visualização do arquivo pra salvar no seu computador.
3. Abre o Claude e cola isto:

> Acabei de baixar um arquivo chamado SKILL.md da skill Conselho de LLMs. Você consegue instalar pra mim? Me guia até onde precisar colocar o arquivo.

O Claude te guia no resto do caminho.

---

## Como usar

Depois de instalada, em qualquer conversa com o Claude, basta dizer uma destas frases:

**Em português:**
- "convoca o conselho"
- "roda o conselho sobre [sua pergunta]"
- "leva isto pro conselho"
- "stress-test isto"
- "war room isto"
- "submete ao conselho"

**Em inglês (originais, ainda funcionam):**
- "council this"
- "run the council on [your question]"
- "pressure-test this"
- "stress-test this"
- "war room this"

O Claude vai convocar os 5 conselheiros, rodar a revisão por pares, e entregar o veredito do presidente.

---

## Créditos

Esta skill foi criada por [Ole Lehmann](https://x.com/itsolelehmann). Vai seguir ele lá, o cara cozinha.

A metodologia foi adaptada do [LLM Council](https://github.com/karpathy/llm-council) do Andrej Karpathy.

Empacotamento original como Claude Skill por [aiwithremy](https://github.com/aiwithremy/claude-skills-llm-council).

Tradução e adaptação para o português brasileiro por [Daniel Feitosa (@gestordeaudiencia)](https://github.com/gestordeaudiencia) — [Cloud Coding Brasil](https://cloudcoding.com.br).

Este repositório só facilita o compartilhamento com amigos brasileiros que querem testar.
