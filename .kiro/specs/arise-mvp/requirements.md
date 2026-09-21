# Requisitos — Arise MVP

**Status:** aprovado · **Versão:** 1.0 · **Data:** 21/09/2026
**Contexto de produto:** `docs/product-brief.md`

## Notação

Critérios de aceitação em **EARS** (Easy Approach to Requirements Syntax), com as palavras-chave em português. `DEVE` equivale a `SHALL` — é obrigação, não intenção.

| Padrão | Forma |
|---|---|
| Ubíquo | O SISTEMA DEVE ⟨comportamento⟩ |
| Dirigido a evento | QUANDO ⟨gatilho⟩ O SISTEMA DEVE ⟨comportamento⟩ |
| Dirigido a estado | ENQUANTO ⟨estado⟩ O SISTEMA DEVE ⟨comportamento⟩ |
| Comportamento indesejado | SE ⟨condição⟩ ENTÃO O SISTEMA DEVE ⟨comportamento⟩ |
| Opcional | ONDE ⟨funcionalidade presente⟩ O SISTEMA DEVE ⟨comportamento⟩ |

---

## R1 — Onboarding e identificação

**História:** Como pessoa sedentária baixando o app, quero um cadastro curto e temático, para começar sem sentir que preenchi um formulário médico.

1. QUANDO o app abre pela primeira vez O SISTEMA DEVE apresentar o fluxo de onboarding em 7 passos com barra de progresso visível em todos eles.
2. O SISTEMA DEVE concluir o onboarding em no máximo 3 minutos para um usuário que não pula nenhum passo.
3. O SISTEMA DEVE coletar como obrigatórios: idade, gênero, peso e altura.
4. O SISTEMA DEVE aceitar circunferência de cintura como campo opcional.
5. O SISTEMA DEVE oferecer as opções de gênero: masculino, feminino, prefiro não informar, personalizado.
6. SE o gênero não for informado ENTÃO O SISTEMA DEVE usar a média das constantes masculina e feminina no cálculo de TMB.
7. O SISTEMA DEVE validar idade entre 16 e 90, peso entre 30 e 300 kg, altura entre 120 e 250 cm.
8. SE a idade informada for menor que 16 ENTÃO O SISTEMA DEVE bloquear o uso do app e explicar o motivo.
9. SE a idade informada estiver entre 16 e 17 ENTÃO O SISTEMA DEVE ocultar permanentemente o módulo calórico e exibir aviso de consentimento dos responsáveis.
10. O SISTEMA DEVE permitir alternar entre unidades métricas e imperiais a qualquer momento, sem perda de dado.
11. QUANDO o usuário conclui o passo de logística O SISTEMA DEVE registrar horário e local de treino escolhidos (intenção de implementação).
12. QUANDO o onboarding termina O SISTEMA DEVE solicitar permissão de notificação, nunca antes.

---

## R2 — Triagem de saúde (PAR-Q+)

**História:** Como usuário com possível condição de saúde, quero ser triado antes de qualquer exercício, para não receber uma prescrição que me machuque.

1. O SISTEMA DEVE apresentar o PAR-Q+ como passo obrigatório e não pulável do onboarding.
2. O SISTEMA DEVE usar as versões oficiais do PAR-Q+ — original em inglês e a versão brasileira validada — sem tradução própria.
3. QUANDO qualquer uma das 7 perguntas iniciais for respondida com "sim" O SISTEMA DEVE abrir o bloco de perguntas de acompanhamento daquela condição.
4. SE o acompanhamento indicar risco ENTÃO O SISTEMA DEVE ativar o Modo Prudência.
5. ENQUANTO o Modo Prudência estiver ativo O SISTEMA DEVE limitar toda prescrição a RPE 5, permitir apenas caminhada, mobilidade e força leve, travar o Rank em D e exibir banner permanente recomendando liberação médica.
6. SE o usuário relatar dor no peito em repouso, condição instável ou gravidez de risco ENTÃO O SISTEMA DEVE bloquear toda prescrição de treino e liberar apenas conteúdo educativo e caminhada leve.
7. O SISTEMA DEVE registrar a data da triagem e sua validade de 12 meses.
8. QUANDO a triagem completar 12 meses O SISTEMA DEVE reapresentá-la antes de gerar a próxima Missão Diária.
9. QUANDO o usuário registrar uma lesão nova O SISTEMA DEVE reapresentar a triagem.
10. O SISTEMA DEVE excluir do plano todo exercício contraindicado pelas limitações declaradas e substituí-lo pela regressão apropriada.
11. O SISTEMA DEVE deixar claro, no onboarding e no rodapé de todo conteúdo educativo, que o app não substitui avaliação médica.

---

## R3 — Linha de base e Rank inicial

**História:** Como usuário destreinado, quero que o app calibre o ponto de partida no meu nível real, para não receber um treino impossível nem um inútil.

1. O SISTEMA DEVE coletar 4 autorrelatos de condicionamento: tolerância a escadas, flexões com boa forma, caminhada contínua de 20 min, e tempo sem treino regular.
2. O SISTEMA DEVE oferecer como opcional um teste de campo: caminhada de 6 minutos por GPS ou sentar-levantar em 30 segundos.
3. QUANDO os autorrelatos forem concluídos O SISTEMA DEVE derivar o Rank inicial entre E e C.
4. O SISTEMA DEVE calcular a TMB pela equação de Mifflin-St Jeor: `(10 × peso_kg) + (6,25 × altura_cm) − (5 × idade) + S`, com `S = +5` masculino e `S = −161` feminino.
5. Nas duas primeiras semanas O SISTEMA DEVE usar o fator de atividade autodeclarado.
6. APÓS duas semanas de uso O SISTEMA DEVE derivar o fator de atividade dos dados registrados — passos e sessões concluídas — e ignorar a autodeclaração.
7. QUANDO o Rank inicial for definido O SISTEMA DEVE apresentar o Contrato com a missão do dia, o objetivo final do Rank S e a projeção de semanas até lá.

---

## R4 — Motor de prescrição da Missão Diária

**História:** Como usuário, quero uma missão diária calibrada ao meu nível de hoje, para conseguir cumprir sem me machucar e ainda assim evoluir.

1. O SISTEMA DEVE gerar uma Missão Diária às 00:00 no fuso do usuário.
2. O SISTEMA DEVE compor cada missão com 3 a 5 objetivos cobrindo os padrões: empurrar, pernas, core e aeróbico.
3. ONDE o Rank for C ou superior O SISTEMA DEVE incluir também o padrão puxar.
4. O SISTEMA DEVE calcular o alvo como `alvo_base(rank) × fator_dia × fator_prontidão × fator_progressão`.
5. O SISTEMA DEVE limitar o aumento de volume a **no máximo 10% por semana**, e este limite DEVE ser imposto pelo motor de forma que nenhuma entrada de usuário ou configuração possa excedê-lo.
6. QUANDO duas sessões consecutivas forem bem-sucedidas O SISTEMA DEVE aumentar o alvo em 2,5%.
7. SE o usuário falhar a mesma missão duas vezes consecutivas ENTÃO O SISTEMA DEVE reduzir o alvo em 15% e comunicar como recalibração do Sistema, nunca como falha do usuário.
8. A cada 4ª semana O SISTEMA DEVE prescrever deload com redução de 40% do volume, apresentado como "Semana de Recuperação de Mana".
9. O SISTEMA DEVE impedir que o deload seja pulado.
10. O SISTEMA DEVE prescrever dias de descanso como missão própria, concedendo XP por cumpri-los.
11. O SISTEMA DEVE ajustar o alvo pelo fator de prontidão derivado de VIT, sono e dor relatada, em faixa de 0,7 a 1,1.
12. O SISTEMA DEVE exibir prazo de 24 horas e recompensa (pontos de atributo, XP e caixa de loot) em toda missão.

---

## R5 — Execução da sessão

**História:** Como usuário no meio de um treino, suado e ofegante, quero registrar minhas séries com um toque, para não perder o ritmo mexendo no celular.

1. O SISTEMA DEVE exibir um contador de repetições com alvo de toque de no mínimo 44pt.
2. O SISTEMA DEVE funcionar integralmente sem rede durante toda a sessão.
3. QUANDO um exercício termina O SISTEMA DEVE solicitar o RPE em faixas amplas (3–4, 5–6, 7–8, 9–10), nunca um número exato.
4. O SISTEMA DEVE ancorar o RPE em referência concreta de talk test, e não apenas no número.
5. QUANDO um exercício termina O SISTEMA DEVE apresentar um checklist de forma de 2 perguntas, que alimenta o atributo PER.
6. O SISTEMA DEVE iniciar automaticamente o timer de descanso entre séries.
7. O SISTEMA DEVE manter os botões "Muito difícil" e "Muito fácil" visíveis durante toda a execução.
8. QUANDO o usuário tocar "Muito difícil" O SISTEMA DEVE regredir o exercício imediatamente, sem confirmação e sem mensagem de julgamento.
9. QUANDO o usuário tocar "Muito fácil" O SISTEMA DEVE progredir o exercício imediatamente.
10. O SISTEMA DEVE exibir, durante a série, os 3 pontos-chave de técnica do exercício.
11. O SISTEMA DEVE permitir abandonar a sessão a qualquer momento preservando o progresso parcial.

---

## R6 — Progressão: nível, XP e atributos

**História:** Como usuário, quero ser recompensado por aparecer, para continuar mesmo nas semanas em que meu corpo não evolui.

1. O SISTEMA DEVE manter Nível e Rank como camadas independentes.
2. O SISTEMA DEVE calcular XP como `XP_base(duração × 2) × mult_intensidade × mult_conclusão + bônus_streak + bônus_primeira_do_dia`.
3. O SISTEMA DEVE usar `100 × N^1,45` como XP necessário para o nível N.
4. O SISTEMA NUNCA DEVE reduzir o Nível, sob nenhuma circunstância.
5. QUANDO o usuário sobe de nível O SISTEMA DEVE conceder exatamente 3 pontos de atributo.
6. O SISTEMA DEVE permitir distribuir os pontos manualmente ou por atribuição automática baseada no que foi efetivamente treinado.
7. O SISTEMA DEVE derivar FOR do volume resistido semanal em média móvel de 4 semanas.
8. O SISTEMA DEVE derivar AGI dos minutos aeróbicos semanais, ritmo médio e amplitude de mobilidade.
9. O SISTEMA DEVE derivar VIT de frequência (0,5), passos (0,3) e sono (0,2).
10. O SISTEMA DEVE derivar PER do percentual de séries com forma boa e cadência respeitada.
11. O SISTEMA DEVE derivar INT de artigos lidos e planejamento semanal realizado.
12. SE VIT estiver baixa ENTÃO O SISTEMA DEVE sugerir deload.

---

## R7 — Rank e reavaliação

**História:** Como usuário, quero que meu Rank represente capacidade física real, para que subir signifique alguma coisa.

1. O SISTEMA DEVE alterar o Rank apenas mediante aprovação em teste de benchmark.
2. O SISTEMA DEVE exigir aprovação em **todos** os critérios do rank-alvo para promover.
3. O SISTEMA DEVE oferecer reavaliação a cada 6 semanas.
4. O SISTEMA DEVE permitir reavaliação sob demanda, no máximo uma a cada 3 semanas.
5. SE o usuário ficar 8 semanas inativo ENTÃO O SISTEMA DEVE rebaixar o Rank, apresentando-o como descondicionamento reversível e nunca como fracasso.
6. QUANDO um rebaixamento ocorrer O SISTEMA DEVE preservar Nível, XP, atributos e histórico intactos.
7. QUANDO uma reavaliação for concluída O SISTEMA DEVE recalcular a projeção de semanas até o Rank S com os dados reais do usuário.
8. O SISTEMA DEVE implementar os critérios das faixas E, D, C, B, A e S conforme a tabela §6.2 do product brief.

---

## R8 — Zona de Penalidade e sequência

**História:** Como usuário que perdeu um dia, quero uma forma de voltar sem perder tudo, para não abandonar o app por causa de uma semana ruim.

1. QUANDO uma Missão Diária expira sem conclusão O SISTEMA DEVE abrir a Zona de Penalidade no dia seguinte.
2. O SISTEMA DEVE compor a Zona de Penalidade com exatamente 4 minutos de atividade em RPE 2 a 3.
3. QUANDO a Zona de Penalidade for concluída O SISTEMA DEVE restaurar a sequência e devolver metade do XP perdido.
4. SE a Zona de Penalidade não for concluída ENTÃO O SISTEMA DEVE zerar apenas a sequência.
5. O SISTEMA NUNCA DEVE apagar Nível, Rank, atributos ou histórico por missão perdida.
6. O SISTEMA DEVE conceder 2 Pedras de Recuperação por mês automaticamente.
7. O SISTEMA DEVE permitir adquirir até 2 Pedras extras por mês com Cristais de Mana.
8. QUANDO uma Pedra de Recuperação for usada O SISTEMA DEVE congelar a sequência por 1 dia.
9. QUANDO o usuário declarar lesão O SISTEMA DEVE pausar a sequência sem custo de Pedra.
10. O SISTEMA NUNCA DEVE usar linguagem de vergonha, culpa ou comparação corporal em nenhuma mensagem de falha.

---

## R9 — Dungeon Break

**História:** Como usuário que sumiu por alguns dias, quero um retorno guiado, para não me machucar tentando voltar de onde parei.

1. QUANDO o usuário completar 3 dias consecutivos sem atividade O SISTEMA DEVE disparar o evento Dungeon Break.
2. QUANDO o Dungeon Break dispara O SISTEMA DEVE reduzir o volume das 3 sessões seguintes para 50%.
3. O SISTEMA DEVE apresentar o protocolo de reentrada como evento narrativo, não como advertência.
4. O SISTEMA DEVE retomar o volume normal após as 3 sessões de reentrada.

---

## R10 — Exército de Sombras

**História:** Como usuário, quero colecionar conquistas que me deem algo de útil, para que a coleção não seja enfeite.

1. O SISTEMA DEVE disponibilizar 40 sombras no MVP.
2. O SISTEMA DEVE conceder a cada sombra um benefício funcional real no app — nunca apenas um ícone.
3. O SISTEMA DEVE classificar as sombras nos graus: Soldado, Elite, Cavaleiro, Comandante, Marechal, General.
4. QUANDO uma condição de sombra for satisfeita O SISTEMA DEVE exibir a animação de extração com a palavra de ativação.
5. O SISTEMA DEVE usar exclusivamente nomes originais de sombra, sem nomes de personagens de obra protegida.

---

## R11 — Códice de exercícios

**História:** Como usuário que nunca treinou, quero entender como executar cada movimento, para não fazer errado e me machucar.

1. O SISTEMA DEVE catalogar 80 exercícios no MVP.
2. O SISTEMA DEVE apresentar, para cada exercício, 3 pontos-chave de técnica e 2 a 3 erros comuns com correção.
3. O SISTEMA DEVE apresentar, para todo exercício dos padrões empurrar, puxar, agachar, dobradiça de quadril e core, um par de ilustrações com posição inicial e final.
4. SE um exercício desses padrões não possuir o par de ilustrações ENTÃO O SISTEMA DEVE mantê-lo bloqueado e não prescrevê-lo.
5. O SISTEMA DEVE exibir para cada exercício sua regressão e sua progressão, formando uma escada navegável.
6. O SISTEMA DEVE registrar o critério objetivo de progressão de cada exercício.
7. O SISTEMA DEVE oferecer nome real e nome temático para cada exercício, alternáveis por configuração.
8. O SISTEMA DEVE manter o nome real sempre acessível para busca externa.
9. O SISTEMA DEVE exibir adaptações para as limitações declaradas pelo usuário.

---

## R12 — Persistência offline e backup

**História:** Como assinante, quero que meus 6 meses de progresso sobrevivam à troca de celular, para não perder o que paguei para construir.

1. O SISTEMA DEVE usar SQLite local como fonte da verdade.
2. O SISTEMA DEVE operar integralmente sem rede.
3. O SISTEMA DEVE realizar backup automático do banco em iCloud no iOS e Google Drive / Android Auto Backup no Android.
4. O SISTEMA DEVE oferecer exportação manual completa em arquivo JSON.
5. O SISTEMA DEVE oferecer importação de um arquivo previamente exportado.
6. O SISTEMA NUNCA DEVE bloquear a exportação dos próprios dados do usuário, inclusive após o fim da assinatura.
7. O SISTEMA DEVE criptografar o banco local.
8. QUANDO o usuário solicitar exclusão da conta O SISTEMA DEVE apagar todos os dados em até 30 dias, backups incluídos.
9. O SISTEMA DEVE obter consentimento específico e destacado para dados de saúde, separado do aceite dos termos.
10. O SISTEMA NUNCA DEVE enviar dado de saúde para analytics.

---

## R13 — Assinatura e teste grátis

**História:** Como usuário novo, quero experimentar o app antes de pagar, para saber se vale a assinatura.

1. O SISTEMA DEVE conceder acesso total por um período de teste configurável, com valor inicial de 3 dias.
2. O SISTEMA DEVE expor a duração do teste como uma constante única, alterável sem mudança de arquitetura.
3. O SISTEMA NUNCA DEVE exigir cartão de crédito para iniciar o teste.
4. O SISTEMA DEVE oferecer plano mensal e plano anual, com o anual pré-selecionado e o desconto exibido em percentual.
5. QUANDO o teste expira O SISTEMA DEVE bloquear o app, mantendo acessíveis: histórico em leitura, exportação de dados e tela de assinatura.
6. O SISTEMA DEVE divulgar na própria tela de paywall: duração do teste, preço, periodicidade e renovação automática.
7. O SISTEMA DEVE validar o direito de acesso localmente, via StoreKit 2 e Google Play Billing, sem servidor próprio.
8. SE a validação do direito de acesso falhar por ausência de rede ENTÃO O SISTEMA DEVE conceder 72 horas de tolerância antes de bloquear.
9. O SISTEMA DEVE derivar o fim do teste de timestamp assinado pela loja, nunca do relógio local.
10. O SISTEMA DEVE oferecer "Restaurar compras" acessível sem login.
11. O SISTEMA DEVE exibir no paywall, em texto normal, que os dados ficam no aparelho com cópia em nuvem e que sincronização com conta chega na v1.2.
12. O SISTEMA NUNCA DEVE usar contagem regressiva falsa, confirmação repetida de cancelamento ou vergonha corporal como alavanca de conversão.

---

## R14 — Internacionalização e tom

**História:** Como usuário brasileiro ou americano, quero o app na minha língua e no tom que eu prefiro, para me sentir dentro da fantasia.

1. O SISTEMA DEVE oferecer pt-BR e en-US.
2. O SISTEMA DEVE detectar o idioma do sistema e permitir troca manual em configurações.
3. O SISTEMA DEVE manter a escolha de unidades independente da escolha de idioma.
4. O SISTEMA DEVE formatar números e datas pelo locale ativo.
5. O SISTEMA NUNCA DEVE conter string literal de interface fora dos arquivos de tradução.
6. O SISTEMA DEVE oferecer dois tons de mensagem do Sistema: frio e impessoal como padrão, e Modo Companheiro como alternativa.
7. O SISTEMA DEVE fornecer as duas variantes de tom em ambos os idiomas.
8. O SISTEMA DEVE manter as mensagens do Sistema em namespace isolado, para permitir revisão de tom independente do resto da interface.

---

## R15 — Guardas de segurança do usuário

**História:** Como pessoa destreinada, quero que o app me impeça de exagerar, mesmo quando eu quiser exagerar.

1. O SISTEMA DEVE impor todos os limites desta seção no motor de prescrição, e não apenas na interface.
2. O SISTEMA NUNCA DEVE prescrever a missão canônica completa (300 repetições + 10 km) abaixo do Rank A.
3. O SISTEMA DEVE distribuir as 300 repetições do Rank S em blocos ao longo do dia por padrão.
4. SE o usuário optar por executar a missão canônica em sessão única ENTÃO O SISTEMA DEVE exibir aviso explícito sobre rabdomiólise antes de permitir.
5. SE o usuário registrar dor articular no mesmo padrão de movimento duas vezes ENTÃO O SISTEMA DEVE remover esse padrão do plano e recomendar avaliação profissional.
6. O SISTEMA DEVE manter o módulo calórico desativado por padrão, ativável apenas por opt-in e ocultável permanentemente.
7. O SISTEMA NUNCA DEVE oferecer déficit calórico superior a 20% do gasto energético total.
8. O SISTEMA NUNCA DEVE apresentar fotos de antes e depois, metas de peso agressivas ou linguagem sobre compensar o que foi comido.
9. O SISTEMA NUNCA DEVE oferecer caminho que permita contornar o Modo Prudência.
10. ONDE a usuária declarar gravidez O SISTEMA DEVE ativar o Modo Prudência e recomendar liberação obstétrica.
