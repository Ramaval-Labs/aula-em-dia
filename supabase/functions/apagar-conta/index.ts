/**
 * Edge Function `apagar-conta` (Parte 8, LGPD, SCRUM-75).
 *
 *   POST, com o JWT do professor no `Authorization` → 204, e a conta já não existe
 *
 * Apaga o usuário do Auth, e o banco faz o resto: os `on delete cascade` da
 * 0001 levam perfil, política, disponibilidade, alunos, extrato, propostas e
 * links, numa transação (provado em `tests/database/apagar_conta.test.sql`).
 * Apagar linha por linha pelo app deixaria meia conta se a rede caísse no meio.
 *
 * Quem é apagado sai do JWT, nunca do corpo: aceitar um id no pedido deixaria
 * qualquer professor apagar qualquer outro. O gateway confere o JWT antes de
 * chegar aqui (`verify_jwt = true` no config.toml), e a função confere de novo
 * com o Auth, que também recusa um token de usuário que já não existe.
 *
 * A service role só existe aqui dentro, nos segredos da nuvem: o app nunca a vê.
 * Sem período de carência nem lixeira (decisão de PO, SCRUM-75): a tela pede
 * confirmação com dois toques, e o que foi confirmado é apagado na hora.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

// O Expo Web chama de outra origem que a da função.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const resposta = (status: number) => new Response(null, { status, headers: CORS });

Deno.serve(async (pedido) => {
  if (pedido.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (pedido.method !== 'POST') return resposta(405);

  const jwt = (pedido.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return resposta(401);

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // O usuário do token, conferido pelo Auth. A chave publicável também passa
    // pelo gateway como JWT, mas não é de usuário nenhum: dá 401 aqui.
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user) return resposta(401);

    const { error: erroAoApagar } = await admin.auth.admin.deleteUser(data.user.id);
    if (erroAoApagar) throw erroAoApagar;

    return resposta(204);
  } catch (erro) {
    // Só a mensagem: o pedido, que leva o JWT, não vai para o log.
    console.error(erro instanceof Error ? erro.message : 'falha sem mensagem');
    return resposta(500);
  }
});
