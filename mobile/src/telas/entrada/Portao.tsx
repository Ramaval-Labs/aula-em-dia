/**
 * Portão: escolhe entre a máquina de entrada (Fluxo A) e o app.
 *
 * São duas máquinas separadas de propósito — ver o comentário em
 * `estado/sessao.ts`. O botão físico do Android é tratado aqui para as telas
 * de entrada; dentro do app quem cuida é o próprio `App`.
 */

import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { useSessao } from '../../estado/sessao';
import { Acesso } from './Acesso';
import { BoasVindas } from './BoasVindas';
import { Disponibilidade } from './Disponibilidade';
import { Perfil } from './Perfil';
import { PoliticaInicial } from './PoliticaInicial';
import { PrimeiroAluno } from './PrimeiroAluno';
import { Splash } from './Splash';

const PASSOS = [Perfil, Disponibilidade, PoliticaInicial, PrimeiroAluno];

export function Entrada() {
  const tela = useSessao((s) => s.tela);
  const voltarEntrada = useSessao((s) => s.voltarEntrada);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => voltarEntrada());
    return () => sub.remove();
  }, [voltarEntrada]);

  return tela === 'acesso' ? <Acesso /> : <BoasVindas />;
}

export function Onboarding() {
  const passo = useSessao((s) => s.passo);
  const voltarEntrada = useSessao((s) => s.voltarEntrada);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => voltarEntrada());
    return () => sub.remove();
  }, [voltarEntrada]);

  const Passo = PASSOS[passo - 1] ?? Perfil;
  return <Passo />;
}

export { Splash };
