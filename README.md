# Arise

App de treino no estilo RPG de caçadores, para quem está saindo do sedentarismo.
A missão canônica — 100 flexões, 100 abdominais, 100 agachamentos, 10 km — é o
**boss final**, não o tutorial: no Rank E a missão é *10 flexões na parede,
15 agachamentos na cadeira, 10 minutos de caminhada*.

> `Arise` é nome de trabalho. Ver `docs/product-brief.md` §20 — os
> identificadores técnicos já usam o codinome neutro `app.hunter.system`
> para que a troca de nome não custe os assinantes.

## Rodar

```bash
npm install
npm start          # Expo dev server
npm run android    # ou ios / web
```

```bash
npm test           # motor + sincronização (80 testes)
npm run typecheck
npm run db:test    # sobe Postgres efêmero, aplica migrations, testa o RLS
```

## Estado atual

**Fase 1 completa**: app navegável com dados mockados, sem API e sem backend.
A Missão Diária das telas é **gerada pelo motor** sobre os mocks, nunca escrita
à mão — o que exercita `generateDailyQuest` desde o primeiro dia.

| | |
|---|---|
| Stack | Expo SDK 57 · React Native 0.86 · TypeScript strict · Expo Router · Zustand |
| Telas | Onboarding (4) · Status · Missão · Execução · Level Up · Penalidade · Códice · Exército · Reavaliação |
| Motor | TypeScript puro, sem React e sem I/O — 51 testes, incluindo testes de violação dos guardas de segurança |
| Dados | Repositório em memória atrás de interface; a Fase 2 troca por SQLite sem tocar em UI nem motor |

## Backend

Fase A pronta: schema, políticas de segurança e o núcleo de sincronização.
Ainda não plugado ao app — depende do SQLite local (Fase 2 do MVP), porque
sincronizar um repositório em memória não significa nada.

**A decisão que define o desenho: progressão é derivada, não sincronizada.**
Sincronizar XP como número mutável gera conflito insolúvel — dois aparelhos
treinam offline, ambos incrementam, e não existe merge correto entre "4.915 XP"
e "5.100 XP". Somar duplica, escolher um perde treino. Então todo fato de treino
é um evento imutável com id do cliente, e a progressão é um `fold` sobre eles:
eventos não conflitam, eles se unem. Qualquer ordem de chegada converge para o
mesmo estado — testado com 200 embaralhamentos.

```
supabase/
├── migrations/   0001_schema.sql · 0002_rls.sql
├── tests/        rls.test.sql  (acesso cruzado entre usuários)
└── test.sh       npm run db:test
src/core/sync/    events.ts · fold.ts · merge.ts
```

## Documentação

```
.kiro/
├── steering/            product.md · tech.md · structure.md
└── specs/
    ├── arise-mvp/       requirements.md (EARS) · design.md · tasks.md
    └── arise-backend/   requirements.md (EARS) · design.md · tasks.md
docs/product-brief.md    pesquisa, decisões e justificativas
```

## A regra que governa o código

O motor (`src/core/engine`) não conhece React, banco nem plataforma. Recebe
estado e devolve estado. É o que permite testá-lo exaustivamente — e isso não
é preciosismo: um bug de escalonamento ali não causa tela feia, causa lesão.

`guards.ts` é o último ponto por onde toda missão passa. Teto de +10% de volume
por semana, missão canônica bloqueada abaixo do Rank A, Modo Prudência
inescapável. Cada guarda tem um teste que tenta burlá-lo.
