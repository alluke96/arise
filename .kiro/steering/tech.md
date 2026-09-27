---
inclusion: always
---

# Stack

| Camada | Escolha |
|---|---|
| Framework | Expo (SDK atual) + React Native |
| Linguagem | TypeScript strict |
| Navegação | Expo Router (file-based) |
| Estado | Zustand |
| Banco local | SQLite (`expo-sqlite`) + SQL puro sobre `SqlDriver` |
| Key-value | `react-native-mmkv` |
| Animação | `react-native-reanimated` |
| i18n | `i18next` + `expo-localization` |
| Saúde | HealthKit / Health Connect (só passos no MVP) |
| Assinatura | StoreKit 2 / Google Play Billing |
| Testes | Vitest (motor) + Testing Library (UI) |

## Por que SQL puro em vez de Drizzle

O plano original previa Drizzle. Trocamos por SQL puro atrás de uma interface
`SqlDriver` de ~20 linhas, por um motivo concreto: o driver do Drizzle para
Expo depende do módulo nativo e não roda em Node, então o repositório — a
camada que guarda meses de treino de alguém — só seria exercitado em aparelho.

Com o `SqlDriver`, o **mesmo SQL** roda contra `expo-sqlite` no device e
contra `node:sqlite` nos testes. A suíte de contrato roda os mesmos casos
contra a implementação em memória e contra SQLite real; se divergirem em
qualquer comportamento observável, ela quebra.

## Regras

- **Sem backend no v1.0.** SQLite é a fonte da verdade. Nenhuma chamada de rede no caminho crítico de um treino.
- **O motor de prescrição (`src/core/engine`) é TypeScript puro** — sem React, sem I/O, sem imports de plataforma. Cobertura de teste alta é obrigatória: um bug de escalonamento aqui não causa tela feia, causa lesão.
- **Nenhum identificador técnico carrega o nome "Arise".** Bundle ID e package usam codinome neutro (`app.hunter.system`) porque o nome vai mudar antes do lançamento. O wordmark vive só em `<Wordmark />` e na chave `app.name`.
- **Nenhuma string literal em tela.** Tudo por chave de i18n, nos dois idiomas.
- Preferir bibliotecas que funcionem offline e sem conta.
- **Progressão é derivada, nunca armazenada como verdade.** Nível, XP, rank,
  sequência, sombras e registro de dor são projeções do log de eventos
  (`domain_event`). Se uma projeção divergir do log, o log vence. Quem altera
  progressão emite evento — não escreve estado.
