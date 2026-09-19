/**
 * Ponte entre o `Lancamento` do domínio e a `LinhaExtrato` do catálogo
 * (handoff-ios-glass §2, "Extrato").
 *
 * Mora em `telas/comum/`, e não em `componentes/`, porque é adaptador de
 * domínio: o catálogo desenha a linha com texto pronto e não conhece
 * `Lancamento`. Duas telas mostram o mesmo extrato — a ficha do aluno e a
 * prévia "Meu saldo" —, então a conversão é uma só: cor do delta, texto do
 * rodapé e a alternativa em palavras, que existe porque cor não pode ser o
 * único sinal (spec/acessibilidade.md).
 */

import React from 'react';

import { LinhaExtrato, type TomDoDelta } from '../../componentes/Listas';
import type { Lancamento } from '../../dominio/tipos';

/** Alternativa em texto para o delta — cor não pode ser o único sinal. */
export function deltaEmPalavras(l: Lancamento): string {
  if (l.dinheiro) return 'pagamento recebido';
  if (l.delta < 0) return `${Math.abs(l.delta)} aula debitada`;
  if (l.delta > 0) return `${l.delta} aulas adicionadas`;
  return 'sem efeito no saldo';
}

function tomDo(l: Lancamento): TomDoDelta {
  if (l.dinheiro) return 'pagamento';
  if (l.delta < 0) return 'debito';
  if (l.delta > 0) return 'credito';
  return 'neutro';
}

export function LinhaDoExtrato({ lancamento }: { lancamento: Lancamento }) {
  return (
    <LinhaExtrato
      data={lancamento.d}
      titulo={lancamento.t}
      subtitulo={lancamento.s}
      delta={
        lancamento.dinheiro
          ? '✓'
          : lancamento.delta > 0
            ? `+${lancamento.delta}`
            : String(lancamento.delta)
      }
      deltaEmPalavras={deltaEmPalavras(lancamento)}
      rodape={lancamento.dinheiro ? 'recebido' : `saldo ${lancamento.saldo}`}
      tom={tomDo(lancamento)}
    />
  );
}
