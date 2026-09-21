# Plano — Backend e sincronização

**Requisitos:** `requirements.md` · **Design:** `design.md`

Bloqueado por `arise-mvp` Fase 2 (tarefas 21–27): sem SQLite local, não há o
que sincronizar. As tarefas 1–4 abaixo não dependem disso e já foram feitas.

---

## Fase A — Fundação (independe do SQLite local)

> **Concluída e verificada.** Migrations aplicam em Postgres 16; a suíte de RLS
> confirma que leitura, insert, update e delete cruzados entre usuários são
> todos bloqueados, e que `guild_roster` não expõe dado de saúde. 20 testes de
> convergência do fold passando. Rode com `npm run db:test` e `npm test`.

- [x] **1. Schema em migrations** — tabelas de evento e de documento, índices de cursor — _Req: B2.2, B2.6, B6.1_
- [x] **2. Políticas de row-level security** — negar por padrão, política por tabela, view de guilda sem dado de saúde — _Req: B5.1, B5.2, B4.3, B4.4_
- [x] **3. União de eventos do domínio** — `events.ts` — _Req: B2.2_
- [x] **4. `fold` e `merge` puros, com teste de convergência** — _Req: B2.3, B2.4, B2.6, B2.7_

## Fase B — Sincronização (depende da Fase 2 do MVP)

- [ ] **5. Fila de mutações persistente, com recuo exponencial** — _Req: B3.3, B3.5, B3.8_
- [ ] **6. Cliente Supabase e push por delta com upsert idempotente** — _Req: B3.4, B2.5_
- [ ] **7. Pull por cursor com paginação e re-fold** — _Req: B3.4, B3.6_
- [ ] **8. Sincronização em segundo plano, fora do caminho crítico** — _Req: B3.1, B3.2_
- [ ] **9. Indicador de estado da sincronização em Configurações** — _Req: B3.7_

## Fase C — Contas

- [ ] **10. Auth por link mágico, Apple e Google** — _Req: B1.1, B1.2_
- [ ] **11. Uso anônimo como caminho de primeira classe** — _Req: B1.3, B1.6_
- [ ] **12. Vincular histórico local ao criar conta** — _Req: B1.4_
- [ ] **13. Restaurar instalação nova a partir do servidor** — _Req: B1.5_

## Fase D — Guildas

- [ ] **14. Criar guilda, entrar por convite, limite de 3 a 10** — _Req: B4.1, B4.2_
- [ ] **15. Feed e roster pela view restrita** — _Req: B4.3, B4.4_
- [ ] **16. Raide de Guilda com meta somada** — _Req: B4.5_
- [ ] **17. Saída de membro revoga acesso na hora** — _Req: B4.7_

## Fase E — Conformidade

- [ ] **18. Consentimento destacado para sincronizar dado de saúde** — _Req: B5.3_
- [ ] **19. Desligar sincronização mantendo o app funcional** — _Req: B5.4_
- [ ] **20. Exclusão de conta com purga em 30 dias** — _Req: B5.5_
- [ ] **21. Exportação completa pelo servidor** — _Req: B5.6_
- [ ] **22. Log de auditoria de acesso administrativo** — _Req: B5.8_
- [x] **23. Suíte de teste de RLS com acesso cruzado entre usuários** — `supabase/tests/rls.test.sql` — _Req: B6.3_
- [ ] **24. Ambiente local completo via Supabase CLI** — parcial: `npm run db:test` já sobe Postgres efêmero, aplica migrations e roda o RLS sem projeto hospedado; falta Auth e Storage locais — _Req: B6.2_
