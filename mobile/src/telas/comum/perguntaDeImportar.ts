/**
 * "Levar seus alunos para a conta?" — a pergunta de importar (Parte 4,
 * `SCRUM-61`), que aparece no topo da tela de Alunos.
 *
 * O que importa e quando perguntar é da camada de dados
 * (`dados/importacao.ts`); aqui mora só o estado da pergunta na tela.
 *
 * A resposta fica num módulo, e não num `useState`: a tela de Alunos desmonta
 * a cada navegação, e "Agora não" não pode voltar no primeiro "voltar". Morre
 * ao recarregar o app, como `telas/entrada/modoDeAcesso.ts`.
 */

import { useEffect, useRef, useState } from 'react';

import { importarDadosLocais, temDadosLocaisParaImportar } from '../../dados/importacao';
import { avisos } from '../../estado/avisos';
import { useDados } from '../../estado/dados';
import { useToast } from '../../estado/toast';

/** Já respondida nesta sessão, por qualquer das duas ações. */
let respondida = false;

/** Volta ao "ainda não respondida". Existe para os testes, que montam várias sessões. */
export function reiniciarPerguntaDeImportar() {
  respondida = false;
}

export function usePerguntaDeImportar() {
  const avisar = useToast((s) => s.avisar);
  const [aberta, setAberta] = useState(false);
  const [levando, setLevando] = useState(false);
  // O estado só desabilita no render seguinte; a ref barra o segundo toque.
  const emAndamento = useRef(false);

  useEffect(() => {
    if (respondida) return;
    let montada = true;
    void temDadosLocaisParaImportar().then((tem) => {
      if (tem && montada && !respondida) setAberta(true);
    });
    return () => {
      montada = false;
    };
  }, []);

  const levar = async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setLevando(true);
    try {
      const n = await importarDadosLocais();
      respondida = true;
      setAberta(false);
      if (n > 0) avisar(avisos.importacaoFeita(n));
      // Quem importa não conhece a store: recarregar é de quem chamou.
      await useDados.getState().carregar();
    } catch {
      // Nada ficou pela metade no banco: a pergunta continua, para tentar de novo.
      avisar(avisos.importacaoFalhou);
    } finally {
      emAndamento.current = false;
      setLevando(false);
    }
  };

  const agoraNao = () => {
    respondida = true;
    setAberta(false);
  };

  return { aberta, levando, levar, agoraNao };
}
