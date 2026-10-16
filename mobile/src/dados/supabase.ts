/**
 * Cliente do Supabase (Parte 3 do backend).
 *
 * Preguiçoso de propósito: nasce na primeira chamada de `clienteSupabase()`,
 * e só o modo `supabase` chama. Com `local`, que é o padrão, e nos testes, as
 * variáveis vêm vazias, e importar este arquivo não lança, não abre conexão e
 * não carrega o polyfill de URL: o app de demonstração continua o de hoje.
 *
 * A chave é a publicável. A `service_role` nunca entra no app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from './banco';

/** `EXPO_PUBLIC_BACKEND=supabase` liga o login de verdade; o resto é o modo local. */
export function usaSupabase(backend: string | undefined = process.env.EXPO_PUBLIC_BACKEND): boolean {
  return backend === 'supabase';
}

let cliente: SupabaseClient<Database> | null = null;

export function clienteSupabase(): SupabaseClient<Database> {
  if (cliente) return cliente;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const chave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    throw new Error(
      'EXPO_PUBLIC_BACKEND=supabase precisa de EXPO_PUBLIC_SUPABASE_URL e ' +
        'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY em mobile/.env (ver .env.example).',
    );
  }

  // O guia "Supabase + Expo" importa o polyfill antes do cliente. Aqui ele vem
  // só quando o cliente nasce, para não trocar o URL global do modo local. O
  // `require` é o que deixa isso preguiçoso: um `import` rodaria na carga do app.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga preguiçosa, ver acima
  require('react-native-url-polyfill/auto');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga preguiçosa, ver acima
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');

  const novo = createClient<Database>(url, chave, {
    auth: {
      // O token mora no AsyncStorage, guardado pelo próprio supabase-js. A
      // senha nunca chega ao disco.
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Fora do navegador a renovação do token roda sem parar; a referência do
  // `startAutoRefresh` recomenda ligá-la só com o app em primeiro plano.
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') novo.auth.startAutoRefresh();
    else novo.auth.stopAutoRefresh();
  });

  cliente = novo;
  return novo;
}
