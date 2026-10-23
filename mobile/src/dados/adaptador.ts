/**
 * Repositório local: o estado inteiro num item do AsyncStorage.
 *
 * É o `gravar()` e o `carregar()` que moravam em `estado/dados.ts`, com o
 * mesmo formato e a mesma chave — quem já usa o app continua abrindo os
 * mesmos dados. A diferença é que aqui o erro não é engolido: a promessa
 * rejeita, e a store decide o que fazer com isso.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAVE_ESTADO } from './armazenamento';
import type { Gravado, Persistido, Repositorio } from './repositorio';

/**
 * Só os campos persistidos, um a um, porque `estado` chega como a store
 * inteira. O cache do modo supabase guarda a mesma forma.
 */
export function soPersistido(estado: Persistido): Persistido {
  return {
    alunos: estado.alunos,
    extratos: estado.extratos,
    politicas: estado.politicas,
    perfil: estado.perfil,
    disponibilidade: estado.disponibilidade,
    pacotePadrao: estado.pacotePadrao,
    preferenciasDeAviso: estado.preferenciasDeAviso,
  };
}

export const repositorioLocal: Repositorio = {
  remoto: false,

  async carregar() {
    const bruto = await AsyncStorage.getItem(CHAVE_ESTADO);
    if (!bruto) return null;
    const d = JSON.parse(bruto) as Partial<Gravado> | null;
    // O mínimo para reconhecer um estado nosso; o resto a store completa.
    if (d && Array.isArray(d.alunos) && d.extratos && d.politicas) return d as Gravado;
    return null;
  },

  // O local não olha a mudança: grava tudo, como sempre fez.
  async registrar(_mudanca, estado) {
    await AsyncStorage.setItem(CHAVE_ESTADO, JSON.stringify(soPersistido(estado)));
  },

  async apagar() {
    await AsyncStorage.removeItem(CHAVE_ESTADO);
  },

  // O mesmo formato de sempre: quem já tem alunos `al…` no aparelho segue igual.
  novoIdDeAluno() {
    return `al${Date.now().toString(36)}`;
  },
};
