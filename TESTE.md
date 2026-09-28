# Build de teste pessoal

Branch `claude/arise-teste-pessoal`. **Não vai para a loja.** Serve para testar o
app inteiro no seu aparelho.

## O que é diferente da branch principal

| | Branch principal | Esta branch |
|---|---|---|
| Entrada | direto no onboarding | login **admin / admin** |
| Exercício de carga sem ilustração | bloqueado (R11.4) | prescrito normalmente |
| Espaço de ilustração na sessão | placeholder | removido |
| HealthKit / Health Connect | pendente | fora — sombras de passos aparecem indisponíveis |
| Teste grátis e paywall | 3 dias, depois bloqueia | acesso liberado |
| Laboratório | — | histórico, projeção e relógio |

A triagem continua com as perguntas **adaptadas** do PAR-Q+ (não é o texto
oficial licenciado).

Tudo isso sai de uma constante: `TEST_BUILD` em `src/core/config.ts`.

> ⚠️ O login não é segurança. Usuário e senha estão no código e a sessão é só
> uma marca no banco local — impede abrir o app por acidente, nada mais.

## Rodar no celular

```bash
npm install
npx expo start
```

Abra o **Expo Go** no celular (mesma rede Wi-Fi) e leia o QR code. Se a rede
bloquear, use `npx expo start --tunnel`.

## Como testar a progressão

1. Entre com `admin` / `admin` e faça o onboarding.
2. Faça a missão do dia de verdade — cada repetição e cada tempo são gravados.
3. Em **Status → Lab** (ou Ajustes → Laboratório):
   - **Histórico**: cada missão com alvo × feito, forma e XP.
   - **Próximos treinos**: os próximos 9 treinos se você cumprir tudo. Mostra
     quando um exercício troca de degrau (↑ novo degrau) e quando o alvo sobe.
   - **Cumprir hoje automaticamente**: marca tudo como feito com boa forma.
   - **Avançar para o dia seguinte**: adianta o relógio do app em 1 dia.
   - **Pular 7 dias sem treinar**: testa a Zona de Penalidade e o Dungeon Break.
4. Para subir de rank, use **Reavaliar** no Status. Fica liberada a cada 21 dias.

O relógio só anda para frente. **Ajustes → Apagar tudo** zera o histórico e
volta para a data real, sem deslogar.

## Como a sequência evolui

- Começa pelo degrau mais fácil do rank (ex.: flexão na parede, levantar da
  cadeira com apoio, prancha na parede, marcha parada).
- Semana cumprida → a próxima sobe **10%**, ou **+1 repetição / +2 s / +1 min**
  quando 10% não chega a isso. Na primeira semana o alvo só repete.
- **Troca de degrau**: 2 sessões seguidas cumprindo o alvo com boa forma, e só
  quando o degrau seguinte já começaria com uma dose útil (≥ 8 repetições,
  15 s ou 10 min). A carga é preservada: 16 flexões na parede viram 8 no balcão.
- A cada 4 semanas, uma semana de deload (volume a 60%).
- Falhar duas missões seguidas reduz 15%; voltar de um Dungeon Break começa
  com metade do volume.
- "Muito difícil" / "Muito fácil" na sessão trocam o exercício na hora.
- Dia de descanso é dia de descanso: a missão é honrar o descanso.

Exemplo real, projetado pelo motor para um sedentário (Rank E, só peso do corpo,
3×/semana, cumprindo tudo):

| Semana | Flexão | Agachamento | Core | Aeróbico |
|---|---|---|---|---|
| 1 | parede 9 | cadeira c/ apoio 13 | prancha parede 13 s | marcha 9 min |
| 3 | parede 11 | cadeira c/ apoio 15 | prancha parede 17 s | caminhada 11 min |
| 4 (deload) | parede 7 | cadeira c/ apoio 10 | prancha parede 11 s | caminhada 7 min |
| 5 | parede 12 | **cadeira sem apoio 8** | prancha parede 19 s | caminhada 12 min |
| 9 | parede 15 | cadeira 11 | prancha parede 25 s | caminhada 15 min |
| 10 | **balcão 8** | **caixa 8** | prancha parede 27 s | caminhada 16 min |
| 11 | balcão 9 | caixa 9 | prancha parede 29 s | caminhada 17 min |

Os números são o total de repetições da missão (no Rank E, divididos em 2 séries).
Subir para o Rank D (Reavaliação) libera os degraus seguintes.
