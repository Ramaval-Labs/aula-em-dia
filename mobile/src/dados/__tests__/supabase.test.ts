/**
 * Cliente do Supabase (SCRUM-19): a escolha do modo e o nascimento preguiçoso.
 *
 * Nos testes as variáveis do Supabase não existem, como no modo local. O que
 * se cobra é que importar o arquivo não faz nada e que pedir o cliente sem
 * elas falha dizendo o que falta, em vez de criar um cliente quebrado.
 */

import { clienteSupabase, usaSupabase } from '../supabase';

describe('usaSupabase', () => {
  it('só "supabase" liga o login de verdade', () => {
    expect(usaSupabase('supabase')).toBe(true);
  });

  it.each([undefined, '', 'local', 'Supabase', 'outro'])('%p é o modo local', (valor) => {
    expect(usaSupabase(valor)).toBe(false);
  });

  it('sem nada no ambiente, é o modo local', () => {
    expect(usaSupabase()).toBe(false);
  });
});

describe('clienteSupabase', () => {
  it('sem URL e chave no ambiente, falha dizendo quais variáveis faltam', () => {
    expect(() => clienteSupabase()).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });
});
