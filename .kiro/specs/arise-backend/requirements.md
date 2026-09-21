# Requisitos — Backend e sincronização

**Status:** rascunho · **Versão:** 0.1 · **Data:** 21/09/2026
**Depende de:** `arise-mvp` Fase 2 (persistência SQLite) — sincronizar um
repositório em memória não significa nada.
**Entrega prevista:** v1.2, junto com guildas.

Notação EARS, mesma convenção de `arise-mvp/requirements.md`. `DEVE` = `SHALL`.

---

## B1 — Contas e autenticação

**História:** Como usuário que trocou de celular, quero entrar na minha conta e recuperar meu progresso, para não perder meses de treino.

1. O SISTEMA DEVE permitir criar conta por e-mail com link mágico e por provedor social (Apple e Google).
2. ONDE a plataforma for iOS O SISTEMA DEVE oferecer Sign in with Apple, por exigência da App Store quando há outro login social.
3. O SISTEMA DEVE permitir usar o app integralmente **sem conta**, mantendo o modo offline como caminho de primeira classe.
4. QUANDO um usuário anônimo criar conta O SISTEMA DEVE vincular o histórico local existente à conta nova sem perda de dado.
5. SE o mesmo usuário entrar numa segunda instalação ENTÃO O SISTEMA DEVE reconstruir o estado completo a partir do servidor.
6. O SISTEMA NUNCA DEVE exigir conta para treinar, exportar dados ou ver o histórico.

## B2 — Modelo de dados e convergência

**História:** Como usuário com dois aparelhos, quero que ambos mostrem o mesmo progresso, para não ter que escolher qual está "certo".

1. O SISTEMA DEVE tratar o SQLite local como fonte da verdade e o servidor como réplica.
2. O SISTEMA DEVE modelar todo fato de treino como **evento imutável** com identificador gerado no cliente.
3. O SISTEMA DEVE derivar a progressão (nível, XP, rank, atributos, sequência, pedras) do log de eventos, e não armazená-la como estado autoritativo.
4. O SISTEMA DEVE produzir o mesmo estado derivado para qualquer ordem de chegada dos mesmos eventos.
5. O SISTEMA DEVE tratar o reenvio de um evento já conhecido como no-op.
6. ONDE um registro for documento mutável (perfil, triagem, missão do dia) O SISTEMA DEVE resolver conflito por última escrita, comparando `updated_at`.
7. SE dois aparelhos editarem o mesmo documento no mesmo milissegundo ENTÃO O SISTEMA DEVE desempatar pelo identificador do aparelho, de forma determinística.

## B3 — Protocolo de sincronização

**História:** Como usuário no metrô, quero treinar sem rede e ver tudo sincronizado depois, sem apertar nada.

1. O SISTEMA DEVE sincronizar em segundo plano, sem bloquear nenhuma tela.
2. O SISTEMA NUNCA DEVE colocar uma chamada de rede no caminho crítico de um treino.
3. O SISTEMA DEVE enfileirar mutações locais enquanto não houver rede e enviá-las quando houver.
4. O SISTEMA DEVE sincronizar por delta, enviando apenas o que mudou desde o último cursor confirmado.
5. SE o envio falhar ENTÃO O SISTEMA DEVE repetir com recuo exponencial e preservar a fila.
6. O SISTEMA DEVE avançar o cursor apenas após confirmação do servidor.
7. O SISTEMA DEVE expor o estado da sincronização (em dia, pendente, com erro) em Configurações.
8. O SISTEMA NUNCA DEVE perder um evento local por falha de sincronização.

## B4 — Guildas

**História:** Como usuário, quero um grupo pequeno de pessoas acompanhando meu progresso, para ter com quem me cobrar.

1. O SISTEMA DEVE permitir grupos de 3 a 10 pessoas.
2. O SISTEMA DEVE permitir entrar por código de convite.
3. O SISTEMA DEVE expor aos membros apenas: nome de caçador, rank, nível, sequência e conclusões do dia.
4. O SISTEMA NUNCA DEVE expor a outros membros peso, altura, cintura, respostas de triagem ou qualquer dado de saúde.
5. O SISTEMA DEVE oferecer Raide de Guilda com meta coletiva somada.
6. O SISTEMA NUNCA DEVE oferecer ranking global público.
7. QUANDO um membro sair da guilda O SISTEMA DEVE remover imediatamente o acesso dele aos dados do grupo.

## B5 — Privacidade e LGPD

**História:** Como titular dos meus dados de saúde, quero controle real sobre eles, porque a lei me garante isso.

1. O SISTEMA DEVE aplicar segurança em nível de linha em **todas** as tabelas, de modo que uma linha só seja legível pelo seu dono.
2. O SISTEMA DEVE negar acesso por padrão: nenhuma tabela fica legível sem política explícita.
3. O SISTEMA DEVE obter consentimento específico e destacado para sincronizar dados de saúde, separado do aceite dos termos.
4. O SISTEMA DEVE permitir desligar a sincronização mantendo o app plenamente funcional.
5. QUANDO o usuário solicitar exclusão O SISTEMA DEVE apagar todos os dados do servidor em até 30 dias, incluindo backups.
6. O SISTEMA DEVE permitir exportação completa em formato aberto, também pelo servidor.
7. O SISTEMA NUNCA DEVE enviar dado de saúde para analytics, log de erro ou serviço de terceiro.
8. O SISTEMA DEVE registrar em log de auditoria todo acesso administrativo a dado de usuário.

## B6 — Operação

1. O SISTEMA DEVE versionar o schema em migrations sob controle de versão.
2. O SISTEMA DEVE ser capaz de subir um ambiente local completo sem depender de projeto hospedado.
3. O SISTEMA DEVE testar as políticas de segurança em nível de linha automaticamente, incluindo tentativas de acesso cruzado entre usuários.
4. O SISTEMA DEVE manter compatibilidade retroativa de schema por, no mínimo, duas versões do app.
