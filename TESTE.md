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
4. Para subir de rank, use **Reavaliar** no Status. A primeira fica liberada desde o primeiro dia; depois, a cada 21 dias.

O relógio só anda para frente. **Ajustes → Apagar tudo** zera o histórico e
volta para a data real, sem deslogar.

## Como a sequência evolui

- **Todo mundo começa no Rank E.** O Exame de Aptidão não posiciona ninguém:
  se as respostas mostram que você já tem base, o app recomenda fazer a
  **Reavaliação** logo no primeiro dia (ela fica liberada desde o início).
- Só entra exercício que precisa de objeto se você marcou o equipamento.
  Parede, chão, cadeira, sofá, mesa e degrau de escada contam como "casa".
- Começa leve e pelo degrau mais fácil (flexão na parede, sentar e levantar
  com apoio, prancha na parede, marcha parada).
- Semana cumprida → a próxima sobe **10%**, ou **+1 repetição / +2 s / +1 min**
  quando 10% não chega a isso. Na primeira semana o alvo só repete.
- **Limites**: o aeróbico nunca passa da metade do tempo de sessão que você
  escolheu (20 min de sessão → no máximo 10 min de caminhada), e nenhum alvo
  passa de 2,5× a base do rank. Chegou no limite, é hora da Reavaliação.
- **Troca de degrau**: 2 sessões seguidas cumprindo o alvo com boa forma, e só
  quando o degrau seguinte já começaria com uma dose útil (≥ 8 repetições,
  15 s ou 10 min). A carga é preservada: 16 flexões na parede viram 8 no balcão.
- A cada 4 semanas, uma semana de deload (volume a 60%).
- Falhar duas missões seguidas reduz 15%; voltar de um Dungeon Break começa
  com metade do volume.
- "Muito difícil" / "Muito fácil" na sessão trocam o exercício na hora.

Exemplo real, projetado pelo motor para um sedentário (Rank E, só peso do corpo,
3×/semana, sessão de 20 min, cumprindo tudo):

| Semana | Flexão | Agachamento | Core | Aeróbico |
|---|---|---|---|---|
| 1 | parede 7 | sentar/levantar c/ apoio 9 | prancha parede 11 s | marcha 7 min |
| 3 | parede 9 | c/ apoio 11 | prancha parede 15 s | marcha 9 min |
| 4 (deload) | parede 6 | c/ apoio 7 | prancha parede 10 s | marcha 6 min |
| 5 | parede 10 | c/ apoio 12 | prancha parede 17 s | caminhada 10 min |
| 10 | parede 14 | **sem apoio 8** | prancha parede 25 s | caminhada 10 min |
| 13 | **balcão 8** | sem apoio 10 | prancha parede 29 s | caminhada 10 min |
| 14 | balcão 9 | sem apoio 11 | **prancha de joelhos 16 s** | caminhada 10 min |

Os números são o total da missão (no Rank E, divididos em 2 séries). É de
propósito devagar: quem já tem base sobe pela Reavaliação, não esperando.

> Se você já tinha feito o onboarding antes desta versão (e caiu no Rank D),
> use **Ajustes → Apagar tudo** para recomeçar no E.
