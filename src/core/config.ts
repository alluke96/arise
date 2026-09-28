/**
 * Build de TESTE PESSOAL.
 *
 * Esta branch existe para uma pessoa testar o app inteiro no próprio
 * aparelho. Nunca vai para a loja. O que muda aqui:
 *
 * - Login local fixo (admin/admin) na entrada do app. NÃO é autenticação:
 *   a credencial está no código e só impede que alguém abra o app por
 *   acidente no seu telefone.
 * - Exercício de carga sem ilustração é prescrito mesmo assim (a regra de
 *   segurança R11.4 fica desligada porque as ilustrações ainda não existem).
 * - Sem conexão com HealthKit / Health Connect: sombras que dependem de
 *   passos aparecem como indisponíveis.
 * - Acesso liberado: sem teste grátis nem paywall.
 * - Painel "Laboratório": avançar dias, ver o histórico gravado e a
 *   projeção dos próximos treinos.
 */
export const TEST_BUILD = true;

export const ADMIN_USER = 'admin';
export const ADMIN_PASSWORD = 'admin';

/** R11.4 — exigir par de ilustrações para prescrever exercício de carga. */
export const REQUIRE_ILLUSTRATIONS = !TEST_BUILD;
