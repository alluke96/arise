# Plano de implementação — Arise MVP

**Requisitos:** `requirements.md` · **Design:** `design.md`

Tarefas em ordem de dependência. Cada uma referencia os requisitos que satisfaz. A Fase 1 entrega um app navegável com dados mockados e **sem nenhuma API** — é o que valida o produto antes de investir em persistência.

---

## Fase 1 — Fundação e front com dados mockados

- [ ] **1. Inicializar o projeto Expo**
  - Expo SDK atual, TypeScript strict, Expo Router
  - Bundle ID e package com codinome neutro `app.hunter.system` — nunca "arise"
  - ESLint + Prettier + Vitest configurados
  - _Requisitos: base para todos_

- [ ] **2. Tokens de design e tipografia**
  - `src/ui/tokens.ts` com cores, espaçamento, tipografia, raios
  - Carregar Chakra Petch e Barlow via `expo-font`
  - Nenhum hex fora do arquivo de tokens
  - _Requisitos: design §5.2_

- [ ] **3. Componentes assinatura da UI**
  - `<SystemWindow>` com cantos chanfrados via clip-path, variantes default/highlight/alert
  - `<SystemText>`, `<StatBar>`, `<RankBadge>`, `<Wordmark>`
  - `<RadarChart>` em SVG
  - `<RepCounter>` com alvo ≥ 44pt e haptic
  - Respeitar `prefers-reduced-motion` em toda animação
  - _Requisitos: R5.1, design §5.1, §5.3_

- [ ] **4. Tipos do domínio**
  - `src/core/types.ts` com Rank, Pattern, Attribute, UserProfile, Progression, Exercise, DailyQuest, QuestObjective, HealthScreening
  - _Requisitos: design §3_

- [ ] **5. Motor — XP e níveis**
  - `calcXp`, `xpForLevel` (100 × N^1.45), `applyXp`
  - Teste: nível nunca decresce, em nenhuma entrada
  - _Requisitos: R6.2, R6.3, R6.4, R6.5_

- [ ] **6. Motor — guardas de segurança** ⚠️
  - `clampWeeklyVolume`, `assertCanonicalAllowed`, `applyCautionMode`, `enforceDeload`, `dropPainfulPattern`
  - Cobertura 100% e um teste de tentativa de violação por guarda
  - Teste de propriedade: nenhum histórico aleatório produz aumento > 10%/semana
  - _Requisitos: R15 inteiro, R4.5, R4.8, R4.9, R2.5_

- [ ] **7. Motor — escalonamento e prescrição**
  - `scaleObjective`, `progressionFactor`, `readinessFactor`
  - `generateDailyQuest` compondo 3–5 objetivos por padrão e rank
  - Toda saída passa pelos guardas da tarefa 6
  - _Requisitos: R4.1–R4.12_

- [ ] **8. Motor — rank, atributos e triagem**
  - `initialRank`, `rankCriteria`, `evaluateBenchmark` para as faixas E→S
  - `deriveAttributes` com as fórmulas de FOR/AGI/VIT/PER/INT
  - `evaluateParq` retornando cleared / caution / blocked
  - `mifflinStJeor` e `tdee`
  - _Requisitos: R3.3–R3.6, R6.7–R6.12, R7.1–R7.8, R2.3–R2.6_

- [ ] **9. Motor — penalidade, sequência e Dungeon Break**
  - Máquina de estados de `design.md` §4.4
  - Teste: nenhuma transição altera nível, rank, atributos ou histórico
  - _Requisitos: R8.1–R8.10, R9.1–R9.4_

- [ ] **10. Repositórios: interface + implementação mock**
  - Interfaces `ExerciseRepository`, `QuestRepository`, `ProgressionRepository`, `ProfileRepository`
  - `MockRepository` em memória, tipado pelos tipos do domínio
  - Injeção única em `src/core/repositories/index.ts`
  - _Requisitos: design §6_

- [ ] **11. Seed de dados para demonstração**
  - 20 exercícios reais cobrindo as escadas de flexão, agachamento, core e aeróbico
  - Caçador de demonstração: Rank D, nível 14, sequência 23 dias, 14 sombras
  - A Missão Diária vem de `generateDailyQuest` sobre os mocks, **nunca escrita à mão**
  - _Requisitos: design §6_

- [ ] **12. Stores Zustand**
  - `useProfile`, `useProgression`, `useQuest`, `useSession`
  - Stores chamam motor e repositórios; nenhuma regra de negócio dentro do store
  - _Requisitos: design §1_

- [ ] **13. Navegação e layout**
  - Expo Router: grupo `(onboarding)`, grupo `(tabs)`, rotas soltas de sessão/penalidade/reavaliação/paywall
  - Tab bar com Status, Missão, Códice, Exército
  - _Requisitos: design §2_

- [ ] **14. Telas de onboarding**
  - Despertar, Biometria, Triagem PAR-Q+, Baseline, Logística, Contrato
  - Validação de faixas e bloqueio de menores de 16
  - Modo Prudência acionado pela triagem
  - _Requisitos: R1.1–R1.12, R2.1–R2.11, R3.1–R3.7_

- [ ] **15. Tela de Status**
  - Janela de status, rank, nível, barra de XP, radar de atributos
  - Sequência e Pedras de Recuperação
  - Card da Missão Diária com objetivos e contagem regressiva
  - _Requisitos: R6.1, R6.6, R8.6_

- [ ] **16. Telas de Missão e Execução**
  - Detalhe da missão com objetivos e recompensa
  - Execução: contador, timer de descanso, seletor de RPE em faixas, checklist de forma
  - "Muito difícil" / "Muito fácil" sempre visíveis, regressão imediata sem confirmação
  - _Requisitos: R5.1–R5.11_

- [ ] **17. Telas de Level Up e Zona de Penalidade**
  - Recompensa com +3 pontos de atributo e desbloqueio de sombra
  - Zona de Penalidade com 4 minutos em RPE 2–3 e restauração de sequência
  - Nenhuma linguagem de vergonha em qualquer estado de falha
  - _Requisitos: R6.5, R8.1–R8.5, R8.10_

- [ ] **18. Telas de Códice e Exército de Sombras**
  - Códice com busca, filtros e a escada de progressão navegável
  - Exercícios sem par de ilustrações aparecem bloqueados
  - Grade de sombras com grau e benefício funcional
  - _Requisitos: R10.1–R10.5, R11.1–R11.9_

- [ ] **19. Tela de Reavaliação de Rank**
  - Teste de benchmark guiado, resultado e promoção E→D
  - Recálculo da projeção até o Rank S com dados reais
  - _Requisitos: R7.1–R7.8_

- [ ] **20. Revisão de acessibilidade da Fase 1**
  - Auditoria de contraste 4.5:1 em todas as telas
  - Alvos de toque ≥ 44pt na execução de sessão
  - Rótulos de leitor de tela nos contadores
  - _Requisitos: design §5.3_

---

## Fase 2 — Persistência

- [ ] **21. Schema Drizzle e migrations** — _Requisitos: R12.1_
- [ ] **22. `SqliteRepository` implementando as mesmas interfaces** — _Requisitos: R12.1, design §6_
- [ ] **23. Trocar a injeção de mock para SQLite; motor e UI não mudam** — _Requisitos: design §6_
- [ ] **24. Criptografia do banco local** — _Requisitos: R12.7_
- [ ] **25. Exportação e importação JSON** — _Requisitos: R12.4–R12.6_
- [ ] **26. Backup automático em iCloud e Google Drive** — _Requisitos: R12.3_
- [ ] **27. Consentimento de dados de saúde e exclusão de conta** — _Requisitos: R12.8–R12.10_

## Fase 3 — Conteúdo completo

- [ ] **28. Catálogo dos 80 exercícios com cues e erros comuns** — _Requisitos: R11.1, R11.2_
- [ ] **29. Par de ilustrações para os padrões de carga; bloquear o que não tiver** — _Requisitos: R11.3, R11.4_
- [ ] **30. Programas dos Ranks E, D, C, B, A e S** — _Requisitos: R7.8_
- [ ] **31. As 40 sombras com benefício funcional** — _Requisitos: R10.1, R10.2_
- [ ] **32. Artigos educativos que alimentam INT** — _Requisitos: R6.11_

## Fase 4 — Internacionalização

- [ ] **33. i18next + expo-localization, namespaces por domínio** — _Requisitos: R14.1, R14.2, R14.8_
- [ ] **34. Extrair toda string de interface para arquivos de tradução** — _Requisitos: R14.5_
- [ ] **35. Duas variantes de tom (frio / Modo Companheiro) nos dois idiomas** — _Requisitos: R14.6, R14.7_
- [ ] **36. Unidades independentes do locale; formatação por Intl** — _Requisitos: R14.3, R14.4, R1.10_
- [ ] **37. Incorporar as versões oficiais do PAR-Q+ em inglês e pt-BR** — _Requisitos: R2.2_

## Fase 5 — Assinatura

- [ ] **38. StoreKit 2 e Google Play Billing, validação local** — _Requisitos: R13.7_
- [ ] **39. Teste grátis com duração em constante única** — _Requisitos: R13.1, R13.2, R13.3_
- [ ] **40. Paywall com planos, divulgação obrigatória e aviso de dados locais** — _Requisitos: R13.4, R13.6, R13.11_
- [ ] **41. Bloqueio pós-teste preservando histórico, exportação e assinatura** — _Requisitos: R13.5_
- [ ] **42. Tolerância de 72h offline e timestamp assinado pela loja** — _Requisitos: R13.8, R13.9_
- [ ] **43. Restaurar compras sem login** — _Requisitos: R13.10_

## Fase 6 — Plataforma

- [ ] **44. Passos via HealthKit e Health Connect, com entrada manual como alternativa** — _Requisitos: R6.9, erros §7_
- [ ] **45. Notificações locais: horário, T−4h, T−1h, conclusão; máximo 3/dia** — _Requisitos: R4.12, R1.12_
- [ ] **46. Sono e hidratação alimentando VIT e o fator de prontidão** — _Requisitos: R4.11, R6.9_
- [ ] **47. Explicador de DOMS na semana 1 com notificação no dia 2** — _Requisitos: produto §13_

## Fase 7 — Lançamento

- [ ] **48. Suíte Maestro: onboarding → primeira missão → conclusão** — _Requisitos: design §8_
- [ ] **49. Entrada "Nutrição — em breve" bloqueada em Configurações** — _Requisitos: produto §13_
- [ ] **50. Sentry e PostHog, sem nenhum dado de saúde** — _Requisitos: R12.10_
- [ ] **51. Decidir o nome definitivo e trocar `<Wordmark />` e `app.name`** ⚠️ **antes do primeiro TestFlight** — _Requisitos: produto §20_
- [ ] **52. Fichas das duas lojas com ASO próprio por idioma** — _Requisitos: R14.1_

---

## Nota sobre a ordem

As Fases 1 e 2 são deliberadamente separadas. O motor e a UI são escritos contra **interfaces de repositório**, então a Fase 2 troca a origem dos dados sem tocar em nenhuma tela. Se essa separação vazar — uma tela importando SQLite direto, por exemplo — a Fase 2 deixa de ser uma troca e vira uma reescrita.
