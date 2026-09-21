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
| Banco local | SQLite (`expo-sqlite`) + Drizzle ORM |
| Key-value | `react-native-mmkv` |
| Animação | `react-native-reanimated` |
| i18n | `i18next` + `expo-localization` |
| Saúde | HealthKit / Health Connect (só passos no MVP) |
| Assinatura | StoreKit 2 / Google Play Billing |
| Testes | Vitest (motor) + Testing Library (UI) |

## Regras

- **Sem backend no v1.0.** SQLite é a fonte da verdade. Nenhuma chamada de rede no caminho crítico de um treino.
- **O motor de prescrição (`src/core/engine`) é TypeScript puro** — sem React, sem I/O, sem imports de plataforma. Cobertura de teste alta é obrigatória: um bug de escalonamento aqui não causa tela feia, causa lesão.
- **Nenhum identificador técnico carrega o nome "Arise".** Bundle ID e package usam codinome neutro (`app.hunter.system`) porque o nome vai mudar antes do lançamento. O wordmark vive só em `<Wordmark />` e na chave `app.name`.
- **Nenhuma string literal em tela.** Tudo por chave de i18n, nos dois idiomas.
- Preferir bibliotecas que funcionem offline e sem conta.
