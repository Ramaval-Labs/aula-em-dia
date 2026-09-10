/**
 * Montagem de pacote — módulo puro.
 * Absorve as constantes que estavam cravadas em `dados.ts` (8 aulas fixas,
 * vencimento em 7 dias) e dá conta das opções de A7 e D1.
 */

import { somarDias } from './datas';
import { VALOR_AULA } from './politica';
import type { ConfigPacote, Politicas } from './tipos';

/** Quantidades oferecidas no handoff (A7 e D1). */
export const AULAS_OFERECIDAS = [4, 8, 12];

export const AULAS_PADRAO = 8;

/** Prazo padrão para o primeiro vencimento de um pacote novo. */
export const DIAS_ATE_VENCER = 7;

export function configPadrao(p: Politicas): ConfigPacote {
  return {
    aulas: AULAS_PADRAO,
    valorPorAula: VALOR_AULA,
    validadeDias: p.validadeDias,
    somarSaldo: false,
  };
}

export function validadeDoPacote(validadeDias: number, hoje: string): string {
  return validadeDias === 0 ? 'sem prazo' : somarDias(hoje, validadeDias);
}

export interface PacoteCalculado {
  /** total de aulas do pacote depois de aplicar a soma do saldo */
  total: number;
  saldoFinal: number;
  valorTotal: number;
  validade: string;
  vence: string;
}

/** O que a tela de novo pacote mostra e o que o estado grava. */
export function calcularPacote(
  cfg: ConfigPacote,
  saldoAnterior: number,
  hoje: string,
): PacoteCalculado {
  const somado = cfg.somarSaldo ? saldoAnterior : 0;
  return {
    total: cfg.aulas + somado,
    saldoFinal: cfg.aulas + somado,
    valorTotal: cfg.aulas * cfg.valorPorAula,
    validade: validadeDoPacote(cfg.validadeDias, hoje),
    vence: somarDias(hoje, DIAS_ATE_VENCER),
  };
}
