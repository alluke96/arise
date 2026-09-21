# ARISE — Documento de Requisitos

> *"Você é o Jogador. Ninguém mais recebeu esse convite."*

**Versão:** 0.1 (rascunho para revisão)
**Data:** 21/09/2026
**Status:** Aguardando validação do product owner
**Plataforma:** React Native (iOS + Android)
**Mock visual:** [Arise — Mock MVP](https://claude.ai/artifact/HjUuwnQLCsoqQLsEWwYf6b) — 12 telas navegáveis (privado; precisa ser compartilhado para outras pessoas abrirem)

---

## Índice

1. [Visão do produto](#1-visão-do-produto)
2. [Pesquisa — Solo Leveling](#2-pesquisa--solo-leveling-base-narrativa)
3. [Pesquisa — Ciência do exercício para sedentários](#3-pesquisa--ciência-do-exercício-para-sedentários)
4. [A tradução: lore → mecânica real](#4-a-tradução-lore--mecânica-real)
5. [Onboarding — O Despertar](#5-onboarding--o-despertar)
6. [Sistema de progressão](#6-sistema-de-progressão)
7. [Daily Quest Engine](#7-daily-quest-engine-o-coração-do-app)
8. [Zona de Penalidade e streaks](#8-zona-de-penalidade-e-streaks)
9. [Biblioteca de exercícios](#9-biblioteca-de-exercícios)
10. [Programas de treino por Rank](#10-programas-de-treino-por-rank)
11. [Exército de Sombras (conquistas)](#11-exército-de-sombras-conquistas)
12. [Portais, Masmorras e Raides](#12-portais-masmorras-e-raides)
13. [Nutrição e recuperação](#13-nutrição-e-recuperação-módulo-secundário)
14. [Mapa de telas](#14-mapa-de-telas)
15. [Direção de arte](#15-direção-de-arte)
16. [Arquitetura técnica](#16-arquitetura-técnica)
17. [Modelo de dados](#17-modelo-de-dados)
18. [Segurança, privacidade e LGPD](#18-segurança-privacidade-e-lgpd)
19. [Segurança do usuário (regras invioláveis)](#19-segurança-do-usuário-regras-invioláveis)
20. [Questão jurídica: propriedade intelectual](#20-questão-jurídica-propriedade-intelectual-)
21. [Escopo do MVP e roadmap](#21-escopo-do-mvp-e-roadmap)
22. [Métricas de sucesso](#22-métricas-de-sucesso)
23. [Riscos](#23-riscos)
24. [Decisões pendentes](#24-decisões-pendentes-preciso-da-sua-resposta)
25. [Fontes](#25-fontes-da-pesquisa)

---

## 1. Visão do produto

### 1.1 Pitch

**Arise** é um app de treino que transforma a saída do sedentarismo na fantasia de progressão do *Solo Leveling*: você começa como o caçador mais fraco da humanidade (Rank E), recebe uma Missão Diária de um Sistema que só você enxerga, e sobe de nível através de treinos reais, cientificamente progressivos, até conseguir executar a lendária Missão Diária completa — 100 flexões, 100 abdominais, 100 agachamentos e 10 km de corrida.

A diferença para os apps de "desafio Solo Leveling" que já existem: **eles mandam o sedentário fazer 100 flexões no dia 1.** Isso é ineficaz e perigoso. O Arise inverte a lógica — **a Missão Diária canônica é o boss final, não o tutorial.**

### 1.2 O insight central

No manhwa, o Sistema calibra a missão para o nível do Jinwoo e a **aumenta conforme ele evolui**. Um E-Rank real não faz 100 flexões. Então:

> **O Sistema do Arise se adapta ao Jogador.** Sua Missão Diária no Rank E pode ser *"10 flexões na parede, 15 agachamentos na cadeira, 10 min de caminhada"*. No Rank S, é a missão canônica completa. **Chegar lá leva de 6 a 12 meses — e essa é exatamente a história que o app conta.**

### 1.3 Público-alvo

| Segmento | Descrição | Prioridade |
|---|---|---|
| **Primário** | 18–40 anos, sedentário ou destreinado, fã de anime/manhwa/games, já tentou e desistiu de apps de treino genéricos | P0 |
| **Secundário** | 25–45 anos, retornando ao treino após anos parado, atraído pela narrativa e pela progressão mensurável | P1 |
| **Terciário** | Já ativo, quer gamificação para manter consistência | P2 |

### 1.4 Princípios de design

1. **O Sistema nunca humilha.** Loss aversion sim, vergonha não. A literatura mostra que streaks punitivos aumentam churn e ansiedade.
2. **Toda mecânica de jogo mapeia para uma variável real de treino.** Nada de XP decorativo.
3. **Segurança acima de engajamento.** Se a triagem de saúde acender bandeira vermelha, o app trava o modo intenso — mesmo que isso custe retenção.
4. **A primeira sessão dura menos de 5 minutos.** A barreira de entrada do sedentário é psicológica, não física.
5. **Offline-first.** Treino em academia sem sinal, parque, viagem. Tudo funciona sem rede.

---

## 2. Pesquisa — Solo Leveling (base narrativa)

Pesquisa realizada em fontes primárias (wikis oficiais, sinopses editoriais) e secundárias em setembro/2026.

### 2.1 Premissa

Portais dimensionais ("Gates") passaram a se abrir conectando a Terra a masmorras cheias de Feras Mágicas. Humanos despertaram poderes e viraram **Caçadores (Hunters)**, classificados de E a S por capacidade de mana, medida pela Associação de Caçadores.

**Sung Jinwoo** é um caçador E-Rank apelidado de *"o mais fraco da humanidade"*. Numa masmorra dupla oculta ele quase morre e é escolhido por **O Sistema** — uma interface azul de RPG visível só para ele, que lhe dá missões, XP, níveis e pontos de atributo. Ele é o único Jogador do mundo com progressão infinita, enquanto todos os outros caçadores têm poder estático.

### 2.2 A Missão Diária canônica — pedra fundamental do app

**Quest:** *"A Preparação Para Se Tornar Poderoso"*

| Item | Valor |
|---|---|
| Flexões | 100 |
| Abdominais | 100 |
| Agachamentos | 100 |
| Corrida | 10 km |
| Prazo | 24 horas |
| Recompensas | Recuperação de status, +3 pontos de atributo, caixa de loot aleatória |
| Falha | Teletransporte compulsório para a **Zona de Penalidade** (deserto, 4 horas de sobrevivência) |

Este é o momento mais icônico e mais "fitness" da obra — e é literalmente a rotina do *One-Punch Man*, que já virou desafio viral fora da ficção. **É o núcleo do nosso produto.**

### 2.3 Sistema de Ranks

`E → D → C → B → A → S → Nível Nacional`

- Cada rank é um **salto não-linear** de poder, não um incremento. Um S-Rank sozinho limpa masmorras que exigiriam times inteiros de A-Ranks.
- **E-Rank:** onde quase todos começam. Frágeis até em masmorras fáceis.
- **S-Rank:** categoria tão acima de A que quebra a linearidade da escala.
- **Nível Nacional:** fora do sistema — caçadores tratados como ativos estratégicos de um país, comparáveis ao poder militar de uma nação inteira. Só uma dezena no mundo.
- Rank é atribuído por exame de mana e pode ser **reavaliado** (arco do *Reteste de Rank*) — o que dá lastro narrativo ao nosso teste de reavaliação periódica.

### 2.4 Atributos

Cinco estatísticas, com pontos distribuíveis a cada nível:

| Atributo | Função no original |
|---|---|
| **Força (STR)** | Dano físico, combate corpo a corpo |
| **Agilidade (AGI)** | Velocidade de movimento, reflexos, esquiva, crítico |
| **Vitalidade (VIT)** | HP, defesa, stamina, sobrevivência |
| **Percepção / Sense (PER)** | Consciência ambiental, precisão, detecção |
| **Inteligência (INT)** | Capacidade de mana, potência mágica, cooldowns |

### 2.5 Terminologia aproveitável

| Termo | Significado no original |
|---|---|
| **Gate / Portal** | Portal azul que conecta ao mundo das masmorras; ranqueado de E a S |
| **Dungeon Break** | Se o portal não for fechado a tempo, as feras invadem o mundo real |
| **Masmorra Instantânea** | Masmorra privada, exclusiva do Jinwoo, invisível aos outros, aberta por uma chave do Sistema |
| **Portal Vermelho (Red Gate)** | Portal anômalo que se fecha atrás de você — sem saída até limpar |
| **Núcleo/Cristal de Mana** | Recurso extraído das feras derrotadas; moeda do mundo |
| **Job Change / Mudança de Classe** | Quest secreta que transforma o Jinwoo em Necromante / Monarca das Sombras |
| **"Arise" (Erguei-vos)** | Palavra de ativação da Extração de Sombras — o nome do nosso app |
| **Exército de Sombras** | Soldados extraídos dos inimigos derrotados; leais e imortais. Hierarquia: Soldado → Elite → Cavaleiro → Comandante → Marechal → General |
| **Igris** | Cavaleiro vermelho, primeira sombra de elite, especialista em espada |
| **Beru** | Rei Formiga de Jeju, primeiro General, primeira sombra capaz de fala humana |
| **Ashborn** | O Monarca das Sombras original, antecessor do Jinwoo |
| **Associação de Caçadores** | Órgão que mede, ranqueia e licencia caçadores |
| **Guilda** | Organizações de caçadores; a do Jinwoo é a Ahjin |

### 2.6 Arcos (úteis como capítulos/temporadas do app)

Masmorra Dupla → Redespertar → Masmorra Instantânea → Masmorras & Lagartos → Masmorras & Prisioneiros → Party do Yoo Jinho → **Mudança de Classe** → Portal Vermelho → Castelo do Demônio → **Reteste de Rank** → Portal da Guilda → Retorno ao Castelo → **Ilha de Jeju** → Recrutamento → Guilda Ahjin → Crise no Japão → Conferência Internacional → **Guerra dos Monarcas** → Batalha Final

### 2.7 Estado da franquia (set/2026)

- Anime: S1 (jan/2024), S2 (jan/2025). **S3 confirmada em produção (jun/2026), janela 2027–2028.**
- **Filme "Solo Leveling: Beyond the System"** anunciado em jul/2026, previsto para fim de 2026 / início de 2027.
- Ganhou Anime do Ano, Melhor Série Nova, Melhor Anime de Ação e Melhor Personagem nos Anime Awards 2025.

**Implicação de produto:** há uma janela de hype forte em 2027. O MVP deve estar maduro antes do filme.

### 2.8 Tom e estética do Sistema

- Janelas **azul-ciano translúcidas** flutuando no ar, cantos chanfrados, moldura fina luminosa.
- Tipografia condensada, tudo em caixa alta, com um leve *glitch* na entrada.
- Mensagens sempre em linguagem imperativa e impessoal:
  `[Você recebeu uma nova missão diária.]` / `[AVISO: A Missão Diária não foi concluída.]`
- Som: um *chime* seco e cristalino ao abrir janela; grave pesado no nível.
- Paleta: preto-azulado profundo, ciano elétrico, roxo-sombra, e **dourado só para conquistas raras**.

---

## 3. Pesquisa — Ciência do exercício para sedentários

### 3.1 Diretrizes-base (OMS 2020)

| Recomendação | Valor |
|---|---|
| Aeróbico moderado | **150–300 min/semana** |
| Ou aeróbico vigoroso | 75–150 min/semana |
| Fortalecimento muscular | **≥ 2 dias/semana**, todos os grandes grupos musculares |
| Comportamento sedentário | Reduzir; substituir por atividade de **qualquer** intensidade |

Frase-chave das diretrizes, e mantra do app: **"toda quantidade conta, e alguma atividade é melhor que nenhuma."** Para quem está em zero, a maior parte do benefício vem dos primeiros minutos semanais, não dos últimos.

### 3.2 Prescrição FITT-VP (ACSM)

**F**requência, **I**ntensidade, **T**empo, **T**ipo, **V**olume, **P**rogressão.

Para **destreinados**, a literatura é explícita: *prescrições iniciais conservadoras*.

| Variável | Iniciante destreinado |
|---|---|
| Frequência (força) | 2–3 dias/semana, não consecutivos |
| Intensidade (força) | 40–50% de 1RM, ou RPE 5–6 |
| Volume | 2–4 séries por grupo muscular, 8–12 reps |
| Descanso | 2–3 min entre séries |
| Aeróbico | Começar com 10–15 min contínuos, RPE 3–4 |
| Progressão | Aumentar **uma** variável por vez, ~10%/semana, só ao fim de um bloco |

### 3.3 Intensidade: RPE / RIR

Adotamos a **escala 0–10 (CR10)**, mais intuitiva que a Borg 6–20.

| RPE | Sensação | Uso no app |
|---|---|---|
| 1–2 | Muito leve | Aquecimento, mobilidade, Zona de Penalidade |
| 3–4 | Leve, converso normalmente | Caminhada base, dias de recuperação |
| **5–6** | **Moderado, converso com frases curtas** | **Zona-alvo do Rank E–D** |
| 7–8 | Difícil, controlado (2–3 reps na reserva) | Rank C–A, séries de trabalho |
| 9–10 | Máximo | Só em testes de benchmark, nunca em treino diário |

**Ressalva importante da pesquisa:** iniciantes são notoriamente ruins em autoavaliar RPE. Por isso o app usa **alvos amplos (ex.: "RPE 5 a 7")** e ancora em referências concretas — o *talk test* ("consegue falar uma frase inteira?") — em vez de pedir um número preciso.

### 3.4 Progressões e regressões

O erro central dos apps genéricos é oferecer só o exercício "padrão". O sedentário falha na flexão no chão e conclui que é incapaz. **Toda entrada da biblioteca precisa de uma escada completa.**

**Empurrar (padrão flexão):**
`Parede → Bancada alta → Banco/sofá → Degrau baixo → Joelhos → Negativa lenta → Chão completa → Pés elevados → Diamante`

**Agachar:**
`Sentar-levantar de cadeira (com apoio) → Sem apoio → Agachamento em caixa → Na parede (bola suíça) → Livre parcial → Livre completo → Búlgaro → Pistol assistido`

**Puxar:**
`Remada em pé com elástico → Remada na mesa (inclinada) → Remada australiana → Barra negativa → Barra assistida → Barra completa`

**Core:**
`Prancha na parede → Prancha no joelho → Dead bug → Prancha completa → Prancha lateral → Hollow hold`

Regra de progressão: **quando o usuário completa o alvo de repetições com forma boa em 2 sessões seguidas, o Sistema oferece o próximo degrau.** Nunca força — oferece.

### 3.5 Caminhada e passos

- **7.000–9.000 passos/dia** é a faixa de menor mortalidade. Contra 2.000 passos sedentários: **−47% mortalidade por todas as causas**, −38% risco de demência, −28% quedas, −22% sintomas depressivos.
- **7.000 é a meta do app**, não 10.000 — a marca de 10k é herança de marketing, não de ciência.
- Progressão para sedentários: **+500 a 1.000 passos por semana** sobre a linha de base medida, nunca um salto direto.
- Estrutura de caminhada progressiva validada (estilo Couch-to-5K adaptado):

| Semanas | Sessão | Frequência |
|---|---|---|
| 1–2 | 10–15 min | 3×/semana |
| 3–4 | 20 min | 3–4×/semana |
| 5–6 | 25–30 min | 4×/semana |
| 7–8 | 35 min (~2 km) | 4–5×/semana |

O Couch-to-5K clássico (9 semanas, run/walk, 3×/semana até 30 min contínuos de corrida) entra a partir do **Rank C**, não antes.

### 3.6 Triagem de saúde — PAR-Q+

Padrão internacional para pré-participação. **Obrigatório no onboarding.**

- 7 perguntas iniciais de triagem; se qualquer uma for "sim", abre-se um bloco de perguntas de acompanhamento sobre a condição específica.
- Válido por no máximo **12 meses** — depois expira e precisa ser refeito. O app deve reapresentar anualmente.
- Cobre: doença cardiovascular, câncer, doença respiratória crônica, AVC/lesão medular, diabetes, condições metabólicas, problemas articulares/ósseos, saúde mental, gravidez, medicação para pressão.
- Existe **versão validada em português brasileiro** (tradução e adaptação transcultural publicadas) — usar essa, não uma tradução própria.

### 3.7 Gasto energético — Mifflin-St Jeor

```
TMB = (10 × peso_kg) + (6,25 × altura_cm) − (5 × idade) + S
  S = +5 (masculino) | −161 (feminino)
GET = TMB × fator de atividade
```

| Fator | Perfil |
|---|---|
| 1,20 | Sedentário |
| 1,375 | Levemente ativo (1–3×/semana) |
| 1,55 | Moderadamente ativo (3–5×/semana) |
| 1,725 | Muito ativo (6–7×/semana) |
| 1,90 | Atleta / trabalho físico |

**Acurácia:** ±10% em ~70% das pessoas; supera Harris-Benedict. Perde precisão em extremos de peso.
**Maior fonte de erro:** o próprio usuário superestima o fator de atividade em uma categoria inteira. **Mitigação:** o app calcula o fator a partir dos dados registrados (passos + sessões concluídas), não a partir da autodeclaração, após as primeiras 2 semanas.

### 3.8 Gamificação — o que a evidência realmente diz

Fui buscar isso porque a premissa do app depende dele. A evidência é **mista, mas favorável em aderência**:

- Intervenções gamificadas atingem taxas de aderência de até **91%**, e em alguns estudos **1,38×** superiores a programas convencionais.
- Resultados em *desfechos duros* (passos, minutos de atividade moderada-vigorosa) são **inconsistentes** entre estudos.
- **Elementos com maior efeito quando combinados:** sistema de ranking, medalhas/conquistas, pontos, interação social e *subida de nível*. Isoladamente, cada um rende pouco.
- Técnicas de mudança de comportamento com maior suporte: **intenção de implementação** ("vou treinar às 19h na sala"), **reforço positivo** e **gatilhos/lembretes contextuais**.
- **Streaks funcionam por aversão à perda** — perder dói ~2× mais do que ganhar agrada. Mas há literatura sobre o *lado sombrio*: corredores que quebraram streaks longos relatam estresse, culpa e abandono total; streaks também induzem treinar lesionado.

**Conclusões de design que tiro daqui:**
1. Combinar **todos** os elementos (rank + conquistas + pontos + nível + social) — é a combinação que rende, não a peça isolada.
2. Implementar **"Pedra de Recuperação"** (streak freeze) limitada por mês — reduz ansiedade e churn preservando a aversão à perda.
3. **Nunca zerar progresso real.** Um streak quebrado nunca pode apagar nível, rank ou histórico.
4. Forçar **intenção de implementação** no onboarding: o usuário escolhe dia, hora e lugar.

---

## 4. A tradução: lore → mecânica real

Esta é a tabela mais importante do documento. **Nenhum elemento de jogo é decorativo.**

| Elemento Solo Leveling | Mecânica Arise | Variável real de treino |
|---|---|---|
| O Sistema | Motor de prescrição adaptativa | Algoritmo FITT-VP |
| Rank E→S→Nacional | Nível de condicionamento do usuário | Benchmarks físicos objetivos |
| Exame de rank da Associação | Teste de reavaliação a cada 6 semanas | Testes de campo padronizados |
| Missão Diária | Treino do dia, escalado ao rank | Sessão prescrita |
| Zona de Penalidade | Micro-treino de resgate de 4 min | Sessão de intensidade mínima (RPE 2–3) |
| Pontos de atributo | Pontos ganhos por sessão concluída | Volume × qualidade de execução |
| Força (STR) | Volume de treino resistido | Séries × reps × progressão de carga |
| Agilidade (AGI) | Condicionamento e mobilidade | Min de aeróbico + amplitude de movimento |
| Vitalidade (VIT) | Consistência e recuperação | Frequência semanal + sono + passos |
| Percepção (PER) | Qualidade de execução | Cadência, amplitude completa, checklist de forma |
| Inteligência (INT) | Educação do usuário | Explicações lidas, registros nutricionais |
| Portal (Gate) | Treino opcional avulso | Sessão fora do plano |
| Portal Vermelho | Treino de emergência, 7 min, sem pausa | HIIT curto / circuito |
| Dungeon Break | Evento após 3 dias parado | Protocolo de reentrada com volume reduzido |
| Masmorra Instantânea | Treino em casa, sem equipamento | Rotina apenas peso corporal |
| Raide de Boss | Teste de benchmark | 1RM estimado, teste de 12 min, teste de reps máximas |
| Extração de Sombra ("Arise!") | Desbloqueio de conquista | Marco de consistência ou performance |
| Exército de Sombras | Coleção de conquistas, cada uma com um perk | Buffs funcionais reais no app |
| Mudança de Classe | Escolha de especialização após 8 semanas | Força / Resistência / Emagrecimento / Híbrido |
| Cristais de Mana | Moeda interna | Ganha treinando, gasta em Pedras de Recuperação e cosméticos |
| Guilda | Grupo social de 3–10 pessoas | Accountability compartilhado |
| Caçador Nível Nacional | Leaderboard/hall de veteranos | Manutenção do Rank S por 12+ semanas |

---

## 5. Onboarding — "O Despertar"

Fluxo de 7 passos, encenado como o teste de despertar da Associação de Caçadores. **Tempo-alvo: 3 minutos.** Barra de progresso sempre visível. Tudo pulável exceto o passo 3.

### Passo 1 — Cinemática de abertura (15s, pulável)
Tela preta. Texto digitando em ciano:
```
[Detectando candidato...]
[Capacidade de mana: não mensurável.]
[Classificação provisória: E]

Você é o caçador mais fraco da humanidade.
Isso muda hoje.

[Deseja aceitar? S / N]
```

### Passo 2 — Identificação
| Campo | Tipo | Obrigatório | Uso |
|---|---|---|---|
| Nome do Caçador | texto, 3–20 chars | Sim | Exibição |
| Avatar | 8 presets ou foto | Não | Exibição |

### Passo 3 — Dados biométricos *(obrigatório)*
Apresentado como "Registro na Associação de Caçadores".

| Campo | Tipo / UI | Validação | Uso |
|---|---|---|---|
| **Idade** | Roleta numérica | 16–90 | TMB, ajuste de progressão, faixas de FC |
| **Gênero** | Masculino / Feminino / Prefiro não informar / Personalizado | — | Constante da Mifflin-St Jeor; se não informado, usa a média das duas |
| **Peso** | kg (ou lb), 1 casa decimal | 30–300 kg | TMB, carga relativa, gráfico de evolução |
| **Altura** | cm (ou ft/in) | 120–250 cm | TMB, IMC |
| **Circunferência de cintura** | cm — *opcional* | 40–200 | Melhor marcador de risco que o IMC; usado no gráfico de progresso |

**Regras:**
- Menores de 18: fluxo adaptado, sem módulo calórico, prescrição com foco em movimento e habilidade, aviso de consentimento dos responsáveis. **Menores de 16 são bloqueados.**
- Unidades métricas/imperiais alternáveis a qualquer momento.
- **O módulo de calorias é opcional e desativado por padrão.** Ver §19.

### Passo 4 — Triagem de saúde (PAR-Q+ pt-BR) *(obrigatório, não pulável)*
As 7 perguntas padrão, em linguagem do Sistema mas sem distorcer o conteúdo clínico.

**Lógica de resultado:**
| Resultado | Comportamento do app |
|---|---|
| Todas "não" | Liberado. Acesso completo aos ranks. |
| Alguma "sim" | Abre perguntas de acompanhamento da condição. |
| Acompanhamento indica risco | **Modo Prudência:** teto em RPE 5, só caminhada + mobilidade + força leve, banner permanente recomendando liberação médica, rank travado em D até confirmação. |
| Dor no peito em repouso, condição instável, gravidez de risco | **Bloqueio de treino.** Só conteúdo educativo e caminhada leve. Mensagem clara para procurar médico. |

O app **reapresenta o PAR-Q+ a cada 12 meses** (validade da triagem) e sempre que o usuário registrar uma lesão nova.

### Passo 5 — Linha de base de condicionamento
Apresentado como "Exame de Aptidão". 4 auto-relatos + 1 teste opcional.

1. *"Quantos lances de escada você sobe antes de ficar sem ar?"* — 0–1 / 1–2 / 2–4 / 4+
2. *"Quantas flexões consegue fazer com boa forma, sem parar?"* — 0 / 1–5 / 6–15 / 16–30 / 30+ (com vídeo de 10s do que é "boa forma")
3. *"Consegue caminhar 20 minutos sem parar?"* — Não / Com esforço / Tranquilo / Tranquilo e mais
4. *"Há quanto tempo não treina com regularidade?"* — Nunca treinei / >2 anos / 6m–2a / <6m / Treino hoje
5. **Opcional:** Teste de caminhada de 6 minutos com GPS, ou teste de sentar-levantar em 30s.

→ Gera o **Rank inicial** (§6.2).

### Passo 6 — Contexto e logística
| Pergunta | Opções | Uso |
|---|---|---|
| Objetivo principal | Perder gordura / Ganhar força e massa / Saúde e disposição / Criar o hábito | Escolhe o template de programa |
| Dias por semana | 2 / 3 / 4 / 5+ | Frequência do plano (mínimo 2, recomendado 3) |
| Duração por sessão | 10 / 20 / 30 / 45+ min | Volume por sessão |
| **Horário e local** | Seletor de hora + "sala / quarto / academia / rua / parque" | **Intenção de implementação** — técnica com maior suporte na literatura |
| Equipamento | Nenhum / Elástico / Halteres / Barra fixa / Academia completa | Filtro da biblioteca |
| Limitações | Joelho / Lombar / Ombro / Punho / Pescoço / Nenhuma | Filtra exercícios contraindicados e força regressões |

### Passo 7 — O Contrato
```
[Missão Diária gerada.]

Rank atual:        E
Nível:             1
Missão de hoje:    10 flexões na parede
                   15 agachamentos na cadeira
                   10 minutos de caminhada

Objetivo final (Rank S):
                   100 flexões
                   100 abdominais
                   100 agachamentos
                   10 km de corrida

Tempo estimado até o Rank S: 32 semanas.

[ACEITAR]
```

Pede permissão de notificação **aqui** — com contexto, não na abertura do app. Pede permissão de HealthKit / Health Connect logo depois, explicando o porquê.

---

## 6. Sistema de progressão

### 6.1 Duas camadas independentes

| Camada | O que representa | Como sobe | Pode cair? |
|---|---|---|---|
| **Nível (1–100+)** | Esforço acumulado | XP por sessão concluída | **Nunca** |
| **Rank (E→Nacional)** | Capacidade física real | Só por teste de benchmark aprovado | Sim, na reavaliação, se regredir muito |

Separar as duas é deliberado: o **Nível** recompensa aparecer (motivação), o **Rank** representa verdade física (honestidade). Um usuário que treina 5 meses e progride pouco ainda sobe de nível — não é punido por genética ou circunstância.

### 6.2 Tabela de Ranks — critérios objetivos

Todo rank exige aprovação em **todos** os critérios num teste de benchmark supervisionado pelo app.

| Rank | Flexões | Agachamentos | Core | Aeróbico | Perfil |
|---|---|---|---|---|---|
| **E** | 0–5 (parede) | 10 sentar-levantar | 15s prancha joelho | 10 min caminhada | Ponto de partida do sedentário |
| **D** | 10 inclinadas (bancada) | 15 livres parciais | 30s prancha joelho | 20 min caminhada contínua | ~4 semanas |
| **C** | 10 de joelhos | 20 livres completos | 45s prancha completa | 30 min caminhada rápida / run-walk | ~10 semanas |
| **B** | 15 completas | 30 livres | 60s prancha | 5 km run-walk | ~18 semanas |
| **A** | 30 completas | 50 livres | 90s prancha + 10 elevações | 5 km corrida contínua | ~26 semanas |
| **S** | **100** | **100** + 100 abdominais | 2 min prancha | **10 km corrida** | ~32–52 semanas |
| **Nacional** | — | — | — | — | Manter Rank S por 12 semanas consecutivas |

> As semanas são estimativas medianas para um adulto saudável de 30 anos partindo do sedentarismo, treinando 3×/semana. O app **recalcula a projeção individualmente** a cada reavaliação e mostra a curva real do usuário, não a genérica.

**Nota de segurança sobre o Rank S:** a missão canônica completa em uma única sessão representa volume muito alto. O app **distribui as 300 repetições ao longo do dia por padrão** (ex.: 4 blocos de 25) e só oferece o modo "sessão única" a partir do Rank A, com aviso explícito sobre rabdomiólise. Ver §19.

### 6.3 XP e níveis

```
XP da sessão = XP_base(duração_min × 2)
             × mult_intensidade(RPE médio: 0,8 a 1,3)
             × mult_conclusão(0,5 parcial | 1,0 completa | 1,15 completa + forma boa)
             + bônus_streak(min(dias_streak × 2, 50))
             + bônus_primeira_do_dia(20)

XP para o nível N = 100 × N^1,45
```

Nível 1→2 ≈ 100 XP (uma sessão). Nível 50 ≈ 100 sessões. A curva desacelera de propósito: a dopamina é densa nas primeiras semanas, que é quando o sedentário desiste.

**+3 pontos de atributo por nível**, distribuíveis manualmente ou por auto-atribuição baseada no que o usuário realmente treinou — fiel ao original, que dá exatamente +3 pontos como recompensa da Missão Diária.

### 6.4 Atributos — cálculo

Os atributos **não são cosméticos**: cada um é derivado de dados reais e alimenta o motor de prescrição.

| Atributo | Fórmula (normalizada 0–100) | Efeito real |
|---|---|---|
| **STR** | Volume resistido semanal (séries × reps × dificuldade relativa), média móvel de 4 semanas | Libera progressões de exercício |
| **AGI** | Minutos aeróbicos/semana + ritmo médio + amplitude nos testes de mobilidade | Ajusta o alvo aeróbico da Missão Diária |
| **VIT** | Frequência (sessões/semana) × 0,5 + passos médios × 0,3 + sono × 0,2 | Determina tolerância de volume; VIT baixa = deload sugerido |
| **PER** | % de séries com forma autoavaliada como boa + cadência respeitada | PER alta libera exercícios mais técnicos |
| **INT** | Artigos lidos + registros de refeição + planejamento semanal feito | Libera conteúdo avançado e controles manuais do plano |

### 6.5 Reavaliação de Rank

- A cada **6 semanas**, ou quando o usuário solicitar (limite: 1×/3 semanas).
- Encenada como o arco do *Reteste de Rank*: convocação da Associação, tela solene, cronômetro.
- Testes guiados por vídeo, com contagem por som/toque.
- **Pode cair de rank** — mas só depois de 8 semanas de inatividade, e a queda é apresentada como "descondicionamento reversível", nunca como fracasso. O Nível permanece intacto.

---

## 7. Daily Quest Engine (o coração do app)

### 7.1 Comportamento

Uma Missão Diária gerada **todo dia às 00:00** no fuso do usuário, escalada ao Rank, ao equipamento disponível, às limitações e ao histórico recente.

```
╔══════════════════════════════════════╗
║  [MISSÃO DIÁRIA]                     ║
║  A Preparação Para Se Tornar Poderoso║
║                                      ║
║  Flexões na parede      12 / 15  ▓▓▓░║
║  Agachamento na cadeira 15 / 15  ▓▓▓▓║
║  Prancha no joelho      20 / 30s ▓▓░░║
║  Caminhada              8 / 12 min▓▓░║
║                                      ║
║  ⏳ Restam 6h 12min                  ║
║                                      ║
║  Recompensa: +3 PTS · 120 XP · Loot  ║
║  AVISO: falha ativa a Zona de        ║
║  Penalidade.                         ║
╚══════════════════════════════════════╝
```

### 7.2 Estrutura da missão

Sempre 3 a 5 objetivos, cobrindo os padrões:

1. **Empurrar** (peito/ombro/tríceps)
2. **Pernas** (agachar ou avançar)
3. **Core**
4. **Aeróbico** (caminhada/corrida/passos)
5. *(Rank C+)* **Puxar** — depende de equipamento; usa elástico ou remada na mesa quando não há barra

### 7.3 Escalonamento

```
alvo_hoje = alvo_base(rank)
          × fator_dia_semana(dia de treino: 1,0 | dia leve: 0,4)
          × fator_prontidão(VIT + sono + dor relatada: 0,7 a 1,1)
          × fator_progressão(+2,5% a cada 2 sessões bem-sucedidas, teto de +10%/semana)
```

**Regras rígidas:**
- Nunca aumentar mais de **10% de volume por semana**.
- Após 2 falhas consecutivas na mesma missão, **reduzir 15%** automaticamente e avisar: `[O Sistema recalibrou sua missão.]` — nunca "você falhou".
- Toda 4ª semana é **deload**: −40% de volume, apresentado como "Semana de Recuperação de Mana".
- Dias de descanso são **obrigatórios** e aparecem como missão: `[Missão: Recuperação. Descanse. O Sistema exige.]` — descanso vale XP.

### 7.4 Execução da sessão

- **Contador de reps grande e tocável** + botão de voz ("próximo").
- Timer de descanso automático com barra ciano.
- Ao fim de cada exercício: seletor rápido de RPE (3 emojis + escala) e **checklist de forma** (2 perguntas, alimenta PER).
- Vídeo demonstrativo em loop de 6s, sempre acessível, com 3 pontos-chave de técnica.
- Botão **"Muito difícil"** sempre visível → regride na hora sem julgamento.
- Botão **"Muito fácil"** → progride na hora.
- Funciona **100% offline**; sincroniza depois.

### 7.5 Notificações

| Momento | Mensagem | Regra |
|---|---|---|
| Horário escolhido no onboarding | `[Missão Diária disponível.]` | Sempre |
| T−4h do prazo | `[AVISO: 4 horas restantes.]` | Só se incompleta |
| T−1h | `[ALERTA: A Zona de Penalidade será ativada em 1 hora.]` | Só se incompleta |
| Conclusão | `[Missão concluída. +3 pontos de atributo.]` | Sempre |

Máximo **3 notificações/dia**. Todas desativáveis individualmente.

---

## 8. Zona de Penalidade e streaks

Aqui eu me afasto conscientemente do material original. No manhwa, a Zona de Penalidade é tortura — 4 horas num deserto infinito com criaturas gigantes. **Traduzir isso literalmente produziria um app que pune sedentários, exatamente o contrário do que a evidência recomenda.**

### 8.1 Redesign ético

A Zona de Penalidade vira uma **segunda chance**, não um castigo.

- Missão perdida → no dia seguinte, abre-se a **Zona de Penalidade**.
- Conteúdo: **4 minutos** de atividade muito leve (RPE 2–3) — mobilidade, caminhada no lugar, alongamento. Os 4 minutos ecoam as 4 horas do original.
- Concluir a Zona **restaura o streak** e devolve metade do XP perdido.
- Não concluir: o streak zera, e nada mais acontece. **Nível, Rank, atributos e histórico permanecem intactos, sempre.**

A estética permanece intimidadora (tela laranja-avermelhada, cronômetro, som grave) mas o conteúdo é trivialmente executável. A intenção é: *nos piores dias, o app pede 4 minutos.*

### 8.2 Pedra de Recuperação (streak freeze)

- **2 por mês**, ganhas automaticamente; até 2 extras compráveis com Cristais de Mana.
- Congelam o streak por 1 dia. Uso automático opcional.
- Justificativa direta da literatura: *streak freezes* reduzem ansiedade e churn **sem** destruir a aversão à perda que faz o mecanismo funcionar.

### 8.3 Dungeon Break

Após **3 dias consecutivos** sem atividade:

```
[ALERTA: DUNGEON BREAK]
As feras escaparam.
Seu condicionamento está regredindo.

Protocolo de reentrada ativado:
próximas 3 sessões com 50% do volume.

[RETORNAR AO CAMPO]
```

Cumpre duas funções: dá dramaticidade ao retorno **e** implementa a redução de volume que a fisiologia realmente exige após uma pausa. É a mecânica de reengajamento mais importante do app — a maior parte do churn acontece exatamente nesta janela.

---

## 9. Biblioteca de exercícios

### 9.1 Escopo do MVP: ~80 exercícios

| Padrão | Qtd | Exemplos |
|---|---|---|
| Empurrar horizontal | 9 | Escada completa da flexão |
| Empurrar vertical | 5 | Desenvolvimento com elástico/haltere, pike push-up |
| Puxar horizontal | 7 | Remada com elástico, remada na mesa, remada australiana |
| Puxar vertical | 5 | Pulldown com elástico, barra negativa, barra completa |
| Agachar | 9 | Escada completa do agachamento |
| Dobradiça de quadril | 7 | Ponte de glúteo, good morning, RDL, levantamento terra |
| Unilateral de perna | 6 | Afundo estático, passada, búlgaro, step-up |
| Core anti-extensão | 6 | Escada da prancha, dead bug, roda abdominal |
| Core anti-rotação | 4 | Pallof press, prancha lateral |
| Flexão de tronco | 4 | Crunch, abdominal completo, elevação de pernas |
| Carregamento | 3 | Farmer's walk, suitcase carry |
| Aeróbico | 8 | Caminhada, run-walk, corrida, marcha no lugar, polichinelo, escada, bike, pular corda |
| Mobilidade | 7 | Gato-camelo, 90/90, world's greatest stretch, alongamento de peitoral |

### 9.2 Campos por exercício

```yaml
id: flexao_parede
nome_pt: "Flexão na parede"
nome_sistema: "Golpe Básico I"        # nome temático
padrao: empurrar_horizontal
nivel_dificuldade: 1                   # 1-10
rank_minimo: E
musculos_primarios: [peitoral, triceps, deltoide_anterior]
equipamento: [nenhum]
regressao: null
progressao: flexao_bancada
contraindicacoes: [punho, ombro]
adaptacao_punho: "Apoiar os punhos fechados ou usar os antebraços na parede"
video_url: ...
duracao_video: 6s
pontos_tecnica:
  - "Corpo em linha reta da cabeça ao calcanhar"
  - "Cotovelos a ~45° do tronco, não abertos a 90°"
  - "Descida em 2 segundos, subida em 1"
erros_comuns:
  - "Quadril caindo ou empinado"
  - "Amplitude parcial — o peito precisa se aproximar da parede"
criterio_progressao: "2 séries de 15 com boa forma, em 2 sessões seguidas"
contribui_atributo: STR
```

### 9.3 Nomes temáticos

Cada exercício tem nome real **e** nome do Sistema. Um toggle nas configurações alterna. O nome real nunca some — o usuário precisa poder pesquisar "flexão" no Google.

---

## 10. Programas de treino por Rank

### Rank E — "Despertar" (semanas 1–4)
- **3 dias/semana, 10–15 min.** Objetivo: criar o hábito, não condicionar.
- Circuito: empurrar (regressão) + agachar (regressão) + core + 10 min de caminhada.
- 2 séries, RPE 4–5. Descanso livre.
- Meta paralela: linha de base de passos **+500/semana**.

### Rank D — "Caçador Licenciado" (semanas 5–10)
- **3 dias/semana, 20 min.** Full body A/B alternado.
- 3 séries, RPE 5–6, descanso de 90s.
- Entra o padrão de puxar (elástico/remada na mesa) e a dobradiça de quadril.
- Caminhada sobe para 20–25 min contínuos. Meta de 5.000 passos/dia.

### Rank C — "Caçador de Campo" (semanas 11–18)
- **3–4 dias/semana, 25–30 min.** Divisão superior/inferior opcional.
- 3 séries, RPE 6–7. Progressão de carga ou de exercício a cada 2 semanas.
- **Entra o Couch-to-5K** (run/walk 3×/semana). Meta de 7.000 passos.

### Rank B — "Caçador de Elite" (semanas 19–26)
- **4 dias/semana, 30–40 min.** Upper/Lower.
- Periodização ondulatória; 3–4 séries, RPE 7–8, RIR 2–3.
- Corrida: 5 km run-walk → contínuo.
- Introdução de trabalho unilateral e carregamentos.

### Rank A — "Monarca em Ascensão" (semanas 27–40)
- **4–5 dias/semana.** Push/Pull/Legs ou Upper/Lower/Full.
- Blocos de 4 semanas com deload. Volume alto, técnica refinada.
- Construção direta para a missão canônica: blocos distribuídos de flexões/agachamentos, corrida progressiva até 8 km.

### Rank S — "A Missão Diária" (semana 41+)
- Missão canônica completa: 100/100/100 + 10 km.
- **Padrão: distribuída em blocos ao longo do dia.** Modo sessão única disponível com aviso de segurança.
- Programação de manutenção com variação semanal para evitar overuse.

---

## 11. Exército de Sombras (conquistas)

Cada conquista é uma **sombra extraída**, com animação de `ARISE!` e um perk funcional real. Grade hierárquica fiel ao original: Soldado → Elite → Cavaleiro → Comandante → Marechal → General.

| Sombra | Grau | Condição | Perk funcional |
|---|---|---|---|
| **Sentinela** | Soldado | Primeira missão concluída | Desbloqueia customização de notificação |
| **Batedor** | Soldado | 7 dias de streak | +10% XP por 7 dias |
| **Sabujo** | Soldado | 10.000 passos em um dia | Widget de passos na home |
| **Cavaleiro de Ferro** | Elite | 30 sessões concluídas | Desbloqueia editor manual de plano |
| **Vigia** | Elite | 4 semanas sem pular dia de treino | +1 Pedra de Recuperação/mês |
| **Espadachim Carmesim** | Cavaleiro | Primeira flexão completa no chão | Desbloqueia tema visual "Chamas" |
| **Berserker** | Cavaleiro | Completar um Portal Vermelho | Desbloqueia biblioteca de HIIT |
| **Marechal de Ferro** | Marechal | Alcançar o Rank B | Desbloqueia periodização avançada |
| **General** | General | Alcançar o Rank S | Título permanente + tema dourado |
| **Monarca das Sombras** | — | Rank Nacional | Hall dos Veteranos + cosmético exclusivo |

~40 sombras no lançamento. Todas dão **algo de útil** — nada de medalha vazia. A tela do Exército de Sombras é a vitrine da jornada e o principal ativo de compartilhamento social.

---

## 12. Portais, Masmorras e Raides

| Modo | O que é | Duração | Quando |
|---|---|---|---|
| **Portal E–S** | Treino avulso fora do plano, ranqueado por dificuldade | 10–45 min | Sempre disponível |
| **Portal Vermelho** | Circuito de emergência, sem pausa, "não dá para sair no meio" | 7 min | Quando o usuário tem pouco tempo |
| **Masmorra Instantânea** | Rotina só com peso corporal, zero equipamento | 15–30 min | Viagem, hotel, casa |
| **Raide de Boss** | Teste de benchmark de reavaliação | 20 min | A cada 6 semanas |
| **Raide de Guilda** | Desafio coletivo: meta somada do grupo (ex.: 100.000 passos em 7 dias) | 1 semana | Evento recorrente |
| **Dungeon Break** | Protocolo de reentrada pós-pausa | 3 sessões | Automático após 3 dias parado |

### Guildas (fase 2)
Grupos de 3–10 pessoas. Feed de conclusões, metas coletivas, ranking interno. **Sem ranking global público** — comparação com estranhos desmotiva iniciantes, e a evidência favorece competição em grupos pequenos e afins.

---

## 13. Nutrição e recuperação (módulo secundário)

**Desativado por padrão.** Ativável em Configurações, com aviso.

- **Cálculo de GET** por Mifflin-St Jeor + fator de atividade *derivado dos dados reais* após 2 semanas.
- Faixas sugeridas, **nunca** um número único: déficit máximo de 20% do GET; proteína 1,6–2,2 g/kg.
- **Sem contador de calorias de alimentos no MVP.** Em vez disso: registro qualitativo ("comeu proteína? vegetais? água?") → alimenta INT.
- **Hidratação:** meta simples, ~35 ml/kg, ajustada por sessão de treino.
- **Sono:** input manual ou via HealthKit/Health Connect → alimenta VIT e o fator de prontidão da missão do dia.
- **Dor muscular tardia (DOMS):** explicador educativo na semana 1 — a dor de 24–72h após as primeiras sessões é a principal causa de abandono precoce, e o app precisa antecipá-la ativamente com uma notificação no dia 2.

---

## 14. Mapa de telas

```
Onboarding (7 passos)
│
└── Tab Bar
    ├── 🏠 Status
    │     ├── Janela de status (nível, rank, XP, atributos, radar chart)
    │     ├── Card da Missão Diária
    │     ├── Streak + Pedras de Recuperação
    │     └── Progresso até o próximo rank
    │
    ├── ⚔️ Missão
    │     ├── Missão Diária → Execução da sessão → Recompensa
    │     ├── Portais disponíveis
    │     └── Zona de Penalidade (condicional)
    │
    ├── 📖 Códice
    │     ├── Biblioteca de exercícios (busca, filtro, vídeos)
    │     ├── Artigos educativos (alimentam INT)
    │     └── Glossário
    │
    ├── 👥 Exército
    │     ├── Sombras desbloqueadas
    │     ├── Histórico de treinos + gráficos
    │     └── Guilda (fase 2)
    │
    └── ⚙️ Associação
          ├── Perfil e biometria
          ├── Reavaliação de Rank
          ├── Notificações, unidades, tema
          ├── Saúde (PAR-Q+, lesões, integrações)
          └── Privacidade e exportação de dados
```

---

## 15. Direção de arte

| Elemento | Especificação |
|---|---|
| **Fundo** | `#0C0618` base, `#150C2B` para superfícies elevadas |
| **Roxo primário** (dominante) | `#7C3AED` — botões, molduras, preenchimentos |
| **Roxo claro** | `#A78BFA` / `#C4B5FD` — bordas luminosas, ícones de grau Elite |
| **Azul claro** (detalhes) | `#7DD3FC` — rótulos de dado, links, aba ativa, barra de XP |
| **Vermelho** (destaques) | `#FF3B5C` em preenchimento, `#FF5470`/`#FF6B85` em texto — contagem regressiva, Zona de Penalidade, alertas da triagem, meta do Rank S |
| **Dourado (raro)** | `#FBBF24` — só Rank S+ e sombras de grau General |
| **Verde sucesso** | `#4ADE80` — exclusivamente "concluído" |
| **Texto** | `#F3EFFF` primário, `#ADA2CC` secundário, `#8A7EAE` terciário |
| **Tipografia display** | **Chakra Petch** 500/600/700 — caixa alta, tracking amplo, números e rótulos de HUD |
| **Tipografia corpo** | **Barlow** 400/500/600 — legibilidade acima de tema |

> A paleta acima é a validada no mock. Regra de uso: **roxo carrega a interface, azul claro marca o dado, vermelho só aparece onde há urgência ou risco real.** Verde e dourado são raros de propósito — se aparecem em toda tela, param de significar algo.

**Componentes assinatura:**
- `<SystemWindow>` — moldura de 1px em roxo claro, **cantos chanfrados via `clip-path`** (nunca arredondados), fundo `#150C2B`, brilho externo sutil. Variante de destaque troca a moldura para azul claro; variante de alerta, para vermelho.
- **Malha de fundo** — grade de 26px em `rgba(139,92,246,.05)` sobre um halo radial roxo no topo. Dá textura de HUD sem virar wash de gradiente.
- **Animação de entrada:** scale de 0.95→1 + fade + glitch horizontal de 80ms + *chime*.
- **Texto digitando** para mensagens do Sistema (pulável com um toque).
- **Level up:** flash de tela cheia, partículas ascendentes, grave pesado, haptic `notificationSuccess`.
- **`ARISE!`** — animação de sombra emergindo do chão ao desbloquear conquista. É o momento-assinatura do app; merece orçamento de animação real.

**Acessibilidade — não negociável:**
- Contraste mínimo **4.5:1** para texto. O ciano sobre azul-escuro precisa ser testado; usar `#4DD0E1` ou mais claro para corpo de texto.
- Respeitar `prefers-reduced-motion`: desliga glitch, partículas e typewriter.
- Alvos de toque ≥ 44pt — crítico, pois o usuário interage **suado, ofegante e com o celular no chão**.
- Modo alto contraste e escala de fonte dinâmica.
- Rótulos para leitor de tela em todos os contadores de repetição.

---

## 16. Arquitetura técnica

| Camada | Escolha | Justificativa |
|---|---|---|
| **Framework** | React Native via **Expo (SDK mais recente)** | Ecossistema maduro, EAS Build, OTA updates |
| **Linguagem** | TypeScript (strict) | — |
| **Navegação** | Expo Router (file-based) | Padrão atual do ecossistema |
| **Banco local** | **SQLite** (`expo-sqlite` ou `op-sqlite` via JSI) + **Drizzle ORM** | JSI elimina overhead da bridge; ganho real em operações intensivas |
| **Key-value** | `react-native-mmkv` | Preferências, flags, cache de sessão |
| **Estado do app** | **Zustand** | Leve, sem boilerplate |
| **Estado de servidor** | **TanStack Query** | Cache, retry, sync |
| **Animação** | `react-native-reanimated` v3+ + `react-native-skia` | Skia para partículas, brilho e a animação `ARISE!` |
| **Gráficos** | `victory-native` (Skia) | Radar de atributos, linha de progresso |
| **Notificações** | `expo-notifications` | Locais no MVP; push na fase 2 |
| **Saúde** | HealthKit (iOS) + Health Connect (Android) via `react-native-health`/`react-native-health-connect` | Passos, FC, sono, treinos |
| **Movimento** | `expo-sensors` (pedômetro), `expo-location` (GPS para corrida) | — |
| **Áudio/haptics** | `expo-av`, `expo-haptics` | Feedback da Missão Diária |
| **Backend (fase 2)** | Supabase (Postgres + Auth + Storage) | Sync, guildas, backup |
| **Analytics** | PostHog (self-host ou EU) | Privacidade; funil de onboarding |
| **Crash** | Sentry | — |

### 16.1 Arquitetura local-first

**Regra dura: o app inteiro funciona sem rede.** SQLite é a fonte da verdade; o backend é réplica. Sync por fila de mutações com resolução *last-write-wins* por campo e timestamps. Nenhuma tela pode exibir spinner de rede durante um treino.

### 16.2 Estrutura de pastas

```
src/
├── app/                      # rotas (Expo Router)
├── features/
│   ├── onboarding/
│   ├── daily-quest/
│   ├── progression/          # XP, rank, atributos
│   ├── exercises/
│   ├── shadows/              # conquistas
│   └── health/               # HealthKit / Health Connect
├── core/
│   ├── engine/               # ⚠️ motor de prescrição — puro, testável, sem React
│   │   ├── fitt.ts
│   │   ├── scaling.ts
│   │   ├── rank.ts
│   │   └── xp.ts
│   ├── db/                   # schema Drizzle + migrations
│   └── sync/
├── ui/                       # SystemWindow, SystemText, StatBar, tokens
└── data/                     # seeds: exercícios, programas, sombras
```

**O motor (`core/engine`) é código puro em TypeScript, sem dependência de React ou de I/O.** Isso permite cobertura de testes alta, que é indispensável: um bug de escalonamento aqui não causa uma tela feia, causa lesão.

---

## 17. Modelo de dados

```sql
users(id, hunter_name, avatar, birth_date, gender, units, created_at)
body_metrics(id, user_id, date, weight_kg, height_cm, waist_cm, body_fat_pct)
health_screening(id, user_id, date, parq_answers_json, result, restrictions_json, expires_at)
user_profile(id, user_id, goal, days_per_week, session_minutes,
             preferred_time, location, equipment_json, limitations_json)

progression(id, user_id, level, xp, rank, str, agi, vit, per, int,
            unspent_points, streak_current, streak_best, recovery_stones)

exercises(id, slug, name_pt, name_system, pattern, difficulty, min_rank,
          equipment_json, muscles_json, contraindications_json,
          regression_id, progression_id, video_url, cues_json,
          common_errors_json, progression_criteria, attribute)

programs(id, rank, name, weeks, days_per_week, template_json)

daily_quests(id, user_id, date, rank, objectives_json, status,
             completed_at, deadline, xp_awarded, is_deload)
quest_objectives(id, quest_id, exercise_id, target_value, target_unit,
                 actual_value, rpe, form_ok, completed_at)

sessions(id, user_id, quest_id, type, started_at, ended_at,
         total_volume, avg_rpe, notes)
set_logs(id, session_id, exercise_id, set_index, reps, weight_kg,
         duration_s, distance_m, rpe, form_ok)

benchmarks(id, user_id, date, rank_before, rank_after, results_json, passed)
shadows(id, slug, name, grade, condition_json, perk_json, icon)
user_shadows(id, user_id, shadow_id, unlocked_at)

penalty_zones(id, user_id, date, triggered_by_quest_id, completed, completed_at)
health_samples(id, user_id, date, source, steps, resting_hr, sleep_minutes)
```

---

## 18. Segurança, privacidade e LGPD

Dados de saúde são **dados pessoais sensíveis** sob a LGPD (art. 5º, II) e exigem consentimento específico e destacado.

| Requisito | Implementação |
|---|---|
| **Base legal** | Consentimento específico e destacado para dados de saúde, separado do aceite dos termos |
| **Minimização** | Não coletar o que não alimenta uma funcionalidade concreta |
| **Local-first** | Dados de saúde vivem no dispositivo; sync é **opt-in** |
| **Criptografia** | SQLCipher para o banco local; TLS 1.3 em trânsito; chaves no Keychain/Keystore |
| **Direito de acesso** | Exportação completa em JSON/CSV, na tela de Privacidade |
| **Direito de exclusão** | Apagar conta apaga tudo em ≤30 dias, incluindo backups |
| **HealthKit** | Proibido usar dados de saúde para publicidade (regra da App Store); declarar no manifesto |
| **Health Connect** | Declaração de política de dados de saúde obrigatória na Play Console |
| **Menores** | 16–17 anos: fluxo reduzido, sem módulo calórico, consentimento parental |
| **Analytics** | Nenhum dado de saúde vai para analytics. Só eventos de produto anonimizados |
| **Retenção** | Dados de treino enquanto a conta existir; logs de acesso, 6 meses |

---

## 19. Segurança do usuário (regras invioláveis)

Estas regras **têm precedência sobre qualquer métrica de engajamento**. Devem ser implementadas como guardas no motor, não como recomendações de UX.

1. **PAR-Q+ é obrigatório e bloqueante.** Sem triagem, sem prescrição.
2. **Bandeira vermelha trava o app em Modo Prudência.** Nenhum dark pattern para contornar; nenhuma opção de "pular por hoje".
3. **Teto de progressão: +10% de volume por semana.** Guarda no motor, impossível de exceder, mesmo manualmente.
4. **A missão canônica (300 reps + 10 km) nunca é oferecida abaixo do Rank A**, e nunca em sessão única sem aviso explícito de **rabdomiólise** — que é um risco real e documentado em desafios virais de alto volume com indivíduos destreinados.
5. **Deload obrigatório a cada 4 semanas.** Não pulável.
6. **Dias de descanso são prescritos e recompensados**, nunca tratados como falha.
7. **Registro de dor:** se o usuário marcar dor articular (≠ dor muscular) duas vezes no mesmo padrão, o Sistema remove esse padrão do plano e sugere avaliação profissional.
8. **Nenhum conteúdo pró-anorexia.** Sem fotos "antes/depois", sem alvos de peso agressivos, sem linguagem sobre "queimar" o que comeu, sem déficit calórico acima de 20%. O módulo calórico é **opt-in e desligado por padrão**; ocultável permanentemente.
9. **Disclaimer médico** no onboarding e no rodapé de todo conteúdo educativo: o app não substitui profissional de saúde.
10. **Sem streaks que induzam treinar lesionado.** Há sempre um caminho de 4 minutos para preservar o streak (Zona de Penalidade), e "estou lesionado" pausa o streak sem custo.
11. **Menores de 16 bloqueados.**
12. **Gestantes:** Modo Prudência + recomendação de liberação obstétrica.

---

## 20. Questão jurídica: propriedade intelectual ⚠️

**Preciso sinalizar isso com clareza antes de escrevermos qualquer código.**

*Solo Leveling* é obra protegida. Direitos com **Chugong** (autor), **D&C Media** (editora), **Redice Studio** (webtoon) e **A-1 Pictures** (anime). A franquia é agressivamente licenciada — inclusive há um jogo oficial chamado **"Solo Leveling: ARISE"** (Netmarble), o que agrava diretamente o risco do nosso nome.

### O que **não** podemos usar

| Elemento | Risco |
|---|---|
| Nome "Solo Leveling" em qualquer lugar (nome, subtítulo, ASO, descrição da loja) | **Alto** — marca registrada |
| "Arise" isolado como nome de app de progressão | **Médio-alto** — conflito direto com *Solo Leveling: ARISE* |
| Nomes de personagens (Sung Jinwoo, Igris, Beru, Ashborn, Cha Hae-In...) | **Alto** |
| Arte, sprites, designs de personagens, molduras de UI copiadas frame a frame | **Alto** |
| Trilha sonora, efeitos sonoros do anime | **Alto** |
| Textos literais do manhwa/anime | **Alto** |

### O que **podemos** usar

Mecânicas de jogo e ideias gerais **não são protegidas por direito autoral** — só a expressão específica.

- ✅ Sistema de ranks por letras (E–S) — convenção comum de RPG asiático, anterior à obra
- ✅ Janelas de status azuis, atributos STR/AGI/VIT/INT — vocabulário universal de RPG
- ✅ A rotina 100/100/100 + 10 km — é a rotina do *One-Punch Man*, já em domínio cultural, sem exclusividade
- ✅ Missão diária com prazo e penalidade — mecânica genérica
- ✅ Estética cyber-azul, tom sério, narração impessoal de sistema
- ✅ Nomes **originais** para as sombras (os que propus em §11 são todos originais — "Sentinela", "Espadachim Carmesim", etc., e não nomes canônicos)

### Recomendação

1. **Verificar o nome "Arise" no INPI e na App Store/Play Store antes de investir em marca.** Minha recomendação é **mudar o nome** — sugestões: *Ascend*, *Erguer*, *Level Zero*, *The System*, *Monarch*, *Rank E*, *Despertar*.
2. **Nunca mencionar "Solo Leveling" em material de marketing ou ASO.** Posicionar como "RPG de progressão para quem está começando do zero", não como "app do Solo Leveling".
3. Encomendar **arte original** — inspirada na estética, não derivada dela.
4. **Consultar um advogado de PI** antes do lançamento público. Não sou advogado; isto é análise de risco, não parecer jurídico.
5. Caminho alternativo, se houver tração: buscar **licenciamento oficial** com a D&C Media. Existe precedente de apps de fitness licenciados (ex.: *Zombies, Run!* com parcerias).

**Por ora, escrevi este documento usando "Arise" porque foi o nome que você pediu. A decisão final de nome precisa ser sua, com os riscos acima na mesa.**

---

## 21. Escopo do MVP e roadmap

### MVP (v1.0) — 10 a 14 semanas

| Incluído | Excluído |
|---|---|
| ✅ Onboarding completo + PAR-Q+ | ❌ Backend / contas |
| ✅ Motor de prescrição adaptativa | ❌ Guildas e social |
| ✅ Missão Diária + execução | ❌ Push notifications remotas |
| ✅ Ranks E → C (o resto vem depois) | ❌ Módulo de nutrição |
| ✅ Nível, XP, atributos | ❌ Integração com wearables além de passos |
| ✅ Zona de Penalidade + streaks | ❌ Monetização |
| ✅ ~50 exercícios com vídeo | ❌ Portais e raides |
| ✅ 15 sombras | ❌ Vozes/narração |
| ✅ Notificações locais | ❌ Android TV / watch |
| ✅ SQLite offline + exportação | ❌ i18n além de pt-BR |
| ✅ Passos via HealthKit/Health Connect | |

**Justificativa do corte em Rank C:** um usuário leva ~10 semanas para chegar lá. Construir Ranks B/A/S no MVP é gastar orçamento em conteúdo que ninguém verá antes de termos dados reais de retenção.

### Roadmap

| Fase | Entregas |
|---|---|
| **v1.1** | Ranks B, A, S · biblioteca completa (80 ex.) · Portais e Portal Vermelho · 40 sombras |
| **v1.2** | Backend + contas + sync · Guildas · Raides coletivas · push |
| **v1.3** | Módulo de nutrição e sono · integração com wearables · Apple Watch |
| **v2.0** | Mudança de Classe (especializações) · planos gerados por IA · i18n (EN, ES) · monetização |

**Janela de mercado:** o filme sai no fim de 2026 / início de 2027 e a S3 em 2027–2028. O ideal é ter v1.1 pronta antes do filme.

---

## 22. Métricas de sucesso

| Métrica | Alvo v1.0 | Por quê |
|---|---|---|
| Conclusão do onboarding | > 70% | Onboardings de fitness ficam em 40–60% |
| Primeira missão concluída em D0 | > 55% | Preditor mais forte de retenção |
| Retenção D7 | > 40% | Benchmark de fitness: ~25% |
| Retenção D30 | > 20% | Benchmark: ~10% |
| Retenção D90 | > 12% | Onde apps de treino morrem |
| Streak mediano em D30 | ≥ 8 dias | — |
| Sessões/semana (usuários ativos) | ≥ 2,5 | Limiar mínimo da OMS |
| Conclusão da Zona de Penalidade | > 50% | Valida o redesign ético |
| Recuperação pós-Dungeon Break | > 30% | Valida o protocolo de reentrada |
| **Usuários chegando ao Rank C em 12 sem.** | **> 15%** | **A métrica de verdade: mudança física real** |

---

## 23. Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Ação de PI da D&C Media/Netmarble | Média | **Crítico** | §20 — mudar nome, arte original, sem menção à marca, parecer jurídico |
| Lesão de usuário → responsabilidade civil | Baixa | **Crítico** | §19 — PAR-Q+, tetos no motor, disclaimers, seguro de responsabilidade |
| Tema atrai o público errado (já-atletas) | Média | Médio | Marketing focado em "comecei do zero"; mostrar o Rank E com orgulho |
| Novidade se esgota em 3 semanas | **Alta** | Alto | Progressão real e mensurável é o retentor; gamificação só carrega o começo |
| Streak vira fonte de ansiedade | Média | Médio | Pedras de Recuperação, Zona de Penalidade leve, nunca zerar progresso |
| Complexidade do motor estoura o prazo | Média | Alto | Motor puro em TS, desenvolvido e testado antes da UI |
| Rejeição na App Store (categoria saúde) | Baixa | Médio | Disclaimers, sem promessas médicas, declarações de HealthKit corretas |
| Custo de produção de 80 vídeos | Alta | Médio | MVP com 50; animações 3D ou licenciamento de biblioteca |

---

## 24. Decisões pendentes (preciso da sua resposta)

1. **Nome.** Mantemos "Arise" aceitando o risco de PI, ou escolhemos outro? *(Minha recomendação: trocar — ver §20.)*
2. **Idioma do MVP.** Só pt-BR, ou pt-BR + inglês desde o início? *(O público de manhwa é global; mas i18n dobra o custo de conteúdo.)*
3. **Monetização.** Grátis, freemium (ranks avançados pagos), assinatura, ou compra única? Precisa estar decidido antes da arquitetura de contas.
4. **Escopo do MVP.** Concorda em cortar em Rank C, ou prefere a jornada completa até S no lançamento?
5. **Módulo de nutrição.** Mantemos fora do MVP e opt-in depois, como propus?
6. **Ranking social.** Só guildas pequenas, ou também leaderboard global? *(Recomendo só guildas.)*
7. **Vídeos de exercício.** Filmagem própria, animação 3D, ou licenciar biblioteca pronta? Impacta diretamente prazo e custo.
8. **Tom das mensagens.** O Sistema deve ser frio e impessoal (fiel à obra) ou ter momentos de calor humano? *(Recomendo frio por padrão, com um toggle "Modo Companheiro".)*
9. **Backend no MVP.** Confirma 100% offline na v1.0, ou já quer contas para não perder dados de usuário na troca de aparelho?

---

## 25. Fontes da pesquisa

### Solo Leveling
- [The Preparation To Become Powerful — Solo Leveling Wiki](https://solo-leveling.fandom.com/wiki/The_Preparation_To_Become_Powerful)
- [Class Ranks — Solo Leveling Wiki](https://solo-leveling.fandom.com/wiki/Class_Ranks)
- [National Level Hunters — Solo Leveling Wiki](https://solo-leveling.fandom.com/wiki/National_Level_Hunters)
- [Terminologies — Solo Leveling Wiki](https://solo-leveling.fandom.com/wiki/Terminologies)
- [Gates — Solo Leveling Wiki](https://solo-leveling.fandom.com/wiki/Gates)
- [Story Arcs — Solo Leveling Wiki](https://solo-leveling.fandom.com/wiki/Story_Arcs)
- [Hunter Ranks in Solo Leveling Explained: E-Rank to National Level](https://onlinesololevelingmanga.us/hunter-ranks-solo-leveling-explained/)
- [Solo Leveling Stat System Guide](https://sololeveling.wiki/power-system-and-abilities/solo-leveling-stat-system)
- [Solo Leveling: Shadow Extraction, Explained — Game Rant](https://gamerant.com/solo-leveling-shadow-extraction-explained/)
- [Gates in Solo Leveling, Explained — CBR](https://www.cbr.com/solo-leveling-gates-explained/)
- [Solo Leveling: Would Sung Jinwoo's Training Work in Real Life? — ComicBook.com](https://comicbook.com/anime/news/solo-leveling-jinwoo-training-real-life/)
- [What Is the Solo Leveling Daily Quest? — Epicstream](https://epicstream.com/article/what-is-solo-leveling-daily-quest-sung-jin-woo-workout)
- [All Arcs in Solo Leveling, Listed — Twinfinite](https://twinfinite.net/anime/all-arcs-in-solo-leveling-listed/)
- [Solo Leveling Season 3 Officially Confirmed With New Release Window — CBR](https://www.cbr.com/solo-leveling-season-3-2027-release/)
- [Solo Leveling season 3 release date speculation — GamesRadar](https://www.gamesradar.com/entertainment/anime-shows/solo-leveling-season-3-release-date-trailer-story-cast-news/)
- [Solo Leveling season 2 — Wikipedia](https://en.wikipedia.org/wiki/Solo_Leveling_season_2)

### Ciência do exercício
- [WHO 2020 guidelines on physical activity and sedentary behaviour — PubMed](https://pubmed.ncbi.nlm.nih.gov/33239350/)
- [WHO Guidelines on Physical Activity and Sedentary Behaviour — texto integral](https://iris.who.int/server/api/core/bitstreams/faa83413-d89e-4be9-bb01-b24671aef7ca/content)
- [RECOMMENDATIONS — WHO Guidelines, NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK566046/)
- [Developing the P (for Progression) in a FITT-VP Exercise Prescription — ACSM's Health & Fitness Journal](https://journals.lww.com/acsm-healthfitness/citation/2018/05000/developing_the_p__for_progression__in_a_fitt_vp.4.aspx)
- [Recommendations for resistance training — TREK Education](https://exercise.trekeducation.org/2017/08/16/recommendations-resistance-training/)
- [PAR-Q+ — The International Standard for Pre-Participation Screening](https://eparmedx.com/par-q/)
- [PAR-Q+ 2025 (PDF oficial)](https://eparmedx.com/wp-content/uploads/2025/01/PARQPlus2025ImageFile.pdf)
- [PAR-Q+ versão brasileira: tradução, adaptação transcultural e reprodutibilidade — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8350392/)
- [Application of the Repetitions in Reserve-Based RPE Scale for Resistance Training — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/)
- [Prescribing Intensity in Resistance Training Using RPE: RCT — Frontiers in Physiology](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.891385/full)
- [Rate of Perceived Exertion (RPE) Scale — Cleveland Clinic](https://my.clevelandclinic.org/health/articles/17450-rated-perceived-exertion-rpe-scale)
- [Daily steps and all-cause mortality: meta-analysis of 15 international cohorts — The Lancet Public Health](https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(21)00302-9/fulltext)
- [Association of Daily Step Patterns With Mortality in US Adults — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10051082/)
- [Effects of a daily, home-based, 5-minute eccentric exercise program in sedentary individuals — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12354585/)
- [Bodyweight Exercises: Progressions and Regressions](https://www.riversidecorporatewellness.com/single-post/2018/07/11/bodyweight-exercises-progressions-and-regressions)
- [Ultimate Squat Progression Guide — PowerliftingTechnique](https://powerliftingtechnique.com/squat-progressions/)
- [Start Bodyweight Training: Exercise progressions](http://www.startbodyweight.com/p/exercise-progressions_12.html)
- [Validity of predictive equations to estimate RMR — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7299486/)
- [Mifflin St. Jeor Calculator (TDEE & BMR)](https://www.inchcalculator.com/mifflin-st-jeor-calculator/)

### Gamificação e mudança de comportamento
- [The Effects of mHealth-Based Gamification Interventions on Participation in Physical Activity: Systematic Review — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8855282/)
- [Effectiveness of Gamification Interventions to Improve Physical Activity and Sedentary Behavior: Systematic Review and Meta-Analysis (2025) — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12445784/)
- [Digital Behavior Change Intervention Designs for Habit Formation: Systematic Review — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11161714/)
- [Examining streaking as a behaviour change technique for habit formation in recreational runners — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11494719/)
- [The dark side of streaking: backfire potential in runners who broke a long-term streak — medRxiv](https://www.medrxiv.org/content/10.1101/2024.12.26.24319676.full.pdf)
- [HabitWalk: micro-randomized trial on habit formation in physical activity — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11635918/)
- [Streaks & Milestones: Habit-Forming Gamification (2026)](https://appstorys.com/blog-Streaks-Milestones-Habit-Gamification)

### Técnico
- [Local-first architecture with Expo — Expo Docs](https://docs.expo.dev/guides/local-first/)
- [React Native Local Database Options — PowerSync](https://powersync.com/blog/react-native-local-database-options)
- [Best SQLite Solutions for React Native App Development in 2026 — DEV](https://dev.to/eira-wexford/best-sqlite-solutions-for-react-native-app-development-in-2026-3b5l)
- [LiveStore: SQLite-based data layer for local-first apps — Expo Blog](https://expo.dev/blog/local-first-application-development-with-livestore)

---

*Documento gerado para revisão. Nada foi implementado ainda — aguardando suas respostas na §24.*
