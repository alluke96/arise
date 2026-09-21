---
inclusion: always
---

# Estrutura do repositório

```
.kiro/
├── steering/              # este contexto
└── specs/arise-mvp/       # requirements.md · design.md · tasks.md
docs/
└── product-brief.md       # pesquisa, justificativas, decisões (fonte de verdade do produto)
app/                       # rotas (Expo Router)
src/
├── features/              # onboarding · daily-quest · progression · exercises · shadows
├── core/
│   ├── engine/            # TS puro: fitt · scaling · rank · xp — testável isoladamente
│   ├── db/                # schema Drizzle + migrations
│   └── i18n/
├── ui/                    # SystemWindow, SystemText, StatBar, tokens de design
└── data/                  # seeds: exercícios, programas, sombras, mocks
```

## Convenções

- Um arquivo por componente, nome em PascalCase.
- `features/<dominio>/` agrupa tela + hooks + tipos daquele domínio.
- Tokens de design só em `ui/tokens.ts` — nenhum hex solto em componente.
- Dados mockados vivem em `src/data/mocks/` e obedecem exatamente aos tipos de `core/db/schema` para que a troca por dados reais seja substituição de origem, não de tipo.

## Paleta (resumo)

Roxo domina a interface (`#7C3AED`, `#A78BFA`, fundo `#0C0618`), azul claro marca dado (`#7DD3FC`), vermelho só onde há urgência ou risco (`#FF3B5C`). Verde só "concluído", dourado só Rank S/General. Chakra Petch para HUD, Barlow para corpo.
