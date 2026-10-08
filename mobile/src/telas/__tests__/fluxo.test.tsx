/**
 * Fluxos de ponta a ponta, afirmando o que aparece escrito (SCRUM-34).
 *
 * O `montagem.test.tsx` é fumaça: monta as telas e afirma que nada lança. Aqui
 * o app inteiro é montado e usado como a pessoa usa — tocando no que está na
 * tela — e cada passo afirma texto e rótulo acessível.
 *
 * De onde sai o esperado. Os números vêm da semente (saldo, reposições,
 * limite), e a regra é escrita aqui, à mão: "aula realizada debita uma". O
 * teste não chama o `dominio/` para calcular o que espera — se chamasse,
 * mudar a regra mudaria junto o esperado, e ele nunca quebraria.
 *
 * Datas. Nenhuma asserção escreve uma data. O relógio é fixado só para o
 * motor de agenda sugerir sempre os mesmos horários; o horário que o teste
 * acompanha é lido da tela, do cartão que vem marcado.
 *
 * O que o card descreve e o app não faz:
 * - registrar aula não mostra toast. A confirmação é o sheet "Registrado";
 * - a tela de Resultado é do registro de aula, não da reposição. A reposição
 *   termina em toast e na ficha, e é lá que este teste afirma.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { App } from '../../../App';
import { Toast } from '../../componentes/Toast';
import { estadoInicial } from '../../dados/semente';
import type { Aluno } from '../../dominio/tipos';
import { useDados } from '../../estado/dados';
import { useFormularios } from '../../estado/formularios';
import { useNavegacao } from '../../estado/navegacao';
import { useToast } from '../../estado/toast';
import { TemaProvider } from '../../tema/TemaProvider';

// O App.tsx importa o expo-font, que puxa o expo-asset (nativo, fora do jest).
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

/** Medidas fixas: sem isso o SafeAreaProvider não resolve os insets no teste. */
const METRICA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Uma quarta-feira qualquer, ao meio-dia. Só para a agenda não variar. */
const RELOGIO = new Date(2026, 9, 7, 12, 0, 0);

/**
 * O app como o `Portao` do App.tsx o monta depois do login: a tela e o toast
 * lado a lado. O `Portao` em si não é exportado, e traz fontes e sessão.
 */
const abrirOApp = async () => {
  const app = await render(
    <SafeAreaProvider initialMetrics={METRICA}>
      <TemaProvider>
        <View style={estilos.cheio}>
          <App />
          <Toast />
        </View>
      </TemaProvider>
    </SafeAreaProvider>,
  );
  await app.findByRole('header', { name: 'Alunos' });
  return app;
};

type Tela = Awaited<ReturnType<typeof abrirOApp>>;

const estilos = StyleSheet.create({ cheio: { flex: 1 } });

// ── O esperado, tirado da semente ───────────────────────────────────────────

const semente = () => estadoInicial();
const alunoDaSemente = (id: string): Aluno => {
  const aluno = semente().alunos.find((a) => a.id === id);
  if (!aluno) throw new Error(`a semente não tem o aluno ${id}`);
  return aluno;
};
const saldoDe = (a: Aluno) => a.total - a.usadas;
const primeiroNomeDe = (a: Aluno) => a.name.split(' ')[0];
const quantos = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const restantes = (n: number, total: number) =>
  `${quantos(n, 'aula restante', 'aulas restantes')} de ${total}`;
const restam = (n: number, total: number) =>
  `${quantos(n, 'aula resta', 'aulas restam')} de ${total}`;
const semRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── O que a pessoa faz ──────────────────────────────────────────────────────

const tocarNoBotao = (app: Tela, nome: string | RegExp) =>
  fireEvent.press(app.getByRole('button', { name: nome }));

const abrirAFichaDe = (app: Tela, aluno: Aluno) =>
  tocarNoBotao(app, new RegExp(`^${semRegex(aluno.name)}\\.`));

/** O sheet tem dois "Fechar": o fundo escurecido e o botão. Este é o botão. */
const fecharOSheet = (app: Tela) => fireEvent.press(app.getByText('Fechar'));

/**
 * O horário que vem marcado no passo 2, lido do rótulo que o leitor de tela
 * fala: "Melhor opção. Segunda, 12/10, 19h. É o mesmo horário…".
 */
function horarioMarcado(app: Tela): { dia: string; hora: string } {
  const rotulo = String(app.getByRole('radio', { checked: true }).props.accessibilityLabel);
  const m = /^(?:Melhor opção\. )?(.+?, \d{2}\/\d{2}), (\d{1,2}h)\./.exec(rotulo);
  if (!m) throw new Error(`não reconheci o horário em "${rotulo}"`);
  return { dia: m[1], hora: m[2] };
}

/** As linhas do extrato com este título, pelo rótulo de cada uma. */
const linhasDoExtrato = (app: Tela, titulo: string) =>
  app.queryAllByLabelText(new RegExp(`^[^.]+\\. ${semRegex(titulo)}\\. .*saldo \\d+$`));

beforeEach(async () => {
  // Timer falso pelo mesmo motivo do montagem.test.tsx: as animações deixam
  // quadro agendado, e o processo do Jest sairia com 1 depois de tudo passar.
  jest.useFakeTimers({ now: RELOGIO });
  await AsyncStorage.clear();
  useDados.setState({
    ...estadoInicial(),
    pacotePadrao: undefined,
    preferenciasDeAviso: undefined,
    carregado: false,
  });
  useNavegacao.setState({ tela: 'home', pilha: [], alunoId: null, filtro: 'Urgência' });
  useFormularios.getState().limparTudo();
  useToast.getState().limpar();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('registrar aula', () => {
  it('aula realizada: o saldo cai uma aula no resultado, na ficha e no extrato', async () => {
    const aluno = alunoDaSemente('val');
    const antes = saldoDe(aluno);
    const depois = antes - 1; // a regra: aula realizada debita uma
    const realizadasAntes = semente().extratos.val.filter((l) => l.t === 'Aula realizada').length;

    const app = await abrirOApp();
    await abrirAFichaDe(app, aluno);

    // A ficha mostra o saldo da semente.
    expect(app.getByLabelText(restantes(antes, aluno.total))).toBeTruthy();
    expect(app.getByText(`${aluno.usadas} de ${aluno.total} usadas`)).toBeTruthy();
    expect(linhasDoExtrato(app, 'Aula realizada')).toHaveLength(realizadasAntes);

    await tocarNoBotao(app, 'Registrar aula');
    expect(app.getByRole('header', { name: aluno.name })).toBeTruthy();
    // Nada escolhido: o rodapé está lá, mas não confirma.
    expect(app.getByRole('button', { name: 'Confirmar', disabled: true })).toBeTruthy();

    // O efeito aparece antes de confirmar.
    await fireEvent.press(
      app.getByRole('radio', {
        name: `Aula realizada. Aconteceu como o combinado. Saldo de ${antes} para ${depois}.`,
      }),
    );
    expect(
      app.getByRole('radio', {
        checked: true,
        name: `Aula realizada. Aula usada normalmente. Saldo de ${antes} para ${depois}.`,
      }),
    ).toBeTruthy();
    await tocarNoBotao(app, 'Confirmar');

    // Resultado: o saldo é o que ficou gravado, com UMA aula a menos. O
    // protótipo descontava de novo aqui (divergência 1 do mobile/README.md).
    expect(app.getByRole('header', { name: 'Registrado' })).toBeTruthy();
    expect(app.getByRole('header', { name: 'Aula realizada' })).toBeTruthy();
    expect(app.getByLabelText(restam(depois, aluno.total))).toBeTruthy();
    expect(app.queryByLabelText(restam(depois - 1, aluno.total))).toBeNull();
    expect(app.getByText('−1 aula')).toBeTruthy();
    expect(
      app.getByText(
        `Aula usada normalmente. O lançamento já está no extrato de ${primeiroNomeDe(aluno)}.`,
      ),
    ).toBeTruthy();
    expect(app.queryByRole('button', { name: 'Escolher horário' })).toBeNull();

    await fecharOSheet(app);

    // De volta à ficha: saldo novo, uma usada a mais, o lançamento no extrato.
    expect(app.getByLabelText(restantes(depois, aluno.total))).toBeTruthy();
    expect(app.queryByLabelText(restantes(antes, aluno.total))).toBeNull();
    expect(app.getByText(`${aluno.usadas + 1} de ${aluno.total} usadas`)).toBeTruthy();
    expect(linhasDoExtrato(app, 'Aula realizada')).toHaveLength(realizadasAntes + 1);
    expect(
      app.getByLabelText(new RegExp(`\\. Aula realizada\\. .*1 aula debitada\\. saldo ${depois}$`)),
    ).toBeTruthy();
  });

  it('falta avisada fora do prazo: debita a aula e não oferece reposição', async () => {
    const aluno = alunoDaSemente('mar');
    const minimo = semente().politicas.avisoHoras;
    const antes = saldoDe(aluno);
    const depois = antes - 1; // a regra: aviso abaixo do mínimo debita

    const app = await abrirOApp();
    await abrirAFichaDe(app, aluno);
    await tocarNoBotao(app, 'Registrar aula');
    await fireEvent.press(app.getByRole('radio', { name: /^Falta avisada\./ }));
    await fireEvent.press(app.getByRole('radio', { name: '10h' }));

    expect(
      app.getByText(`Abaixo do seu mínimo de ${minimo}h. A aula é debitada e não gera reposição.`),
    ).toBeTruthy();
    expect(
      app.getByRole('radio', {
        checked: true,
        name:
          `Falta avisada. Aviso com 10h, abaixo do mínimo de ${minimo}h. ` +
          `Saldo de ${antes} para ${depois}.`,
      }),
    ).toBeTruthy();
    await tocarNoBotao(app, 'Confirmar');

    expect(app.getByRole('header', { name: 'Falta avisada' })).toBeTruthy();
    expect(app.getByLabelText(restam(depois, aluno.total))).toBeTruthy();
    expect(app.getByText('−1 aula')).toBeTruthy();
    expect(app.queryByRole('button', { name: 'Escolher horário' })).toBeNull();

    await fecharOSheet(app);
    expect(app.getByLabelText(restantes(depois, aluno.total))).toBeTruthy();
    expect(app.queryByText('Reposição pendente')).toBeNull();
    expect(
      app.getByLabelText(
        new RegExp(
          `\\. Falta avisada\\. Aviso com 10h · fora do prazo\\. ` +
            `1 aula debitada\\. saldo ${depois}$`,
        ),
      ),
    ).toBeTruthy();
  });

  it('falta avisada no prazo: não debita, gera a reposição e leva a marcá-la', async () => {
    const aluno = alunoDaSemente('mar');
    const { avisoHoras: minimo, limiteReposicoes: limite } = semente().politicas;
    const saldo = saldoDe(aluno); // a regra: aviso dentro do prazo não debita
    const nome = primeiroNomeDe(aluno);

    const app = await abrirOApp();
    await abrirAFichaDe(app, aluno);
    await tocarNoBotao(app, 'Registrar aula');
    await fireEvent.press(app.getByRole('radio', { name: /^Falta avisada\./ }));
    await fireEvent.press(app.getByRole('radio', { name: '26h' }));

    expect(
      app.getByText(
        `Dentro do seu mínimo de ${minimo}h. A aula volta para o saldo e uma reposição é gerada.`,
      ),
    ).toBeTruthy();
    expect(
      app.getByRole('radio', {
        checked: true,
        name:
          `Falta avisada. Aviso com 26h, dentro do mínimo de ${minimo}h. ` +
          `Saldo de ${saldo} para ${saldo}.`,
      }),
    ).toBeTruthy();
    await tocarNoBotao(app, 'Confirmar');

    // Resultado: saldo intacto, e o próximo passo é escolher o horário.
    expect(app.getByRole('header', { name: 'Falta avisada' })).toBeTruthy();
    expect(app.getByLabelText(restam(saldo, aluno.total))).toBeTruthy();
    expect(app.getByText('sem debitar')).toBeTruthy();
    expect(
      app.getByText(
        `Aviso com 26h, dentro do mínimo de ${minimo}h. ` +
          `O lançamento já está no extrato de ${nome}.`,
      ),
    ).toBeTruthy();

    // Daqui o assistente abre já no passo 2.
    await tocarNoBotao(app, 'Escolher horário');
    expect(app.getByText('Passo 2 de 3')).toBeTruthy();
    const { dia, hora } = horarioMarcado(app);
    await tocarNoBotao(app, /^Propor /);

    expect(app.getByText('Passo 3 de 3')).toBeTruthy();
    expect(app.getByText(`${dia} · ${hora}`)).toBeTruthy();
    expect(app.getByText(`${aluno.reposicoes + 1} de ${limite}`)).toBeTruthy();
    await fireEvent.press(app.getByRole('switch', { name: 'Pedir confirmação dele' }));
    await tocarNoBotao(app, 'Agendar sem avisar');

    // Toast e ficha: reposição marcada, contada, e o saldo como estava.
    expect(app.getByText(`Reposição de ${nome} marcada para ${dia}, ${hora}.`)).toBeTruthy();
    expect(app.getByText('Reposição confirmada')).toBeTruthy();
    expect(app.getByText(`${dia}, ${hora}. Marcada na sua agenda.`)).toBeTruthy();
    expect(app.queryByText('Reposição pendente')).toBeNull();
    expect(app.getByText(`${aluno.reposicoes + 1} de ${limite} reposições`)).toBeTruthy();
    expect(app.getByLabelText(restantes(saldo, aluno.total))).toBeTruthy();
    expect(
      app.getByLabelText(
        new RegExp(
          `\\. Falta avisada\\. Aviso com 26h · reposição gerada\\. ` +
            `sem efeito no saldo\\. saldo ${saldo}$`,
        ),
      ),
    ).toBeTruthy();
    expect(linhasDoExtrato(app, 'Reposição marcada')).toHaveLength(1);
  });
});

describe('confirmar reposição', () => {
  it('os três passos, avisando o aluno: proposta, aceite e reposição marcada', async () => {
    const aluno = alunoDaSemente('raf');
    const limite = semente().politicas.limiteReposicoes;
    const saldo = saldoDe(aluno); // a regra: marcar reposição não mexe no saldo
    const usadasAntes = aluno.reposicoes;
    const usadasDepois = usadasAntes + 1; // a regra: a reposição conta quando é marcada
    const nome = primeiroNomeDe(aluno);
    const falta = aluno.pendencia?.origem;

    const app = await abrirOApp();
    await abrirAFichaDe(app, aluno);
    expect(app.getByText('Reposição pendente')).toBeTruthy();
    expect(app.getByText(`${usadasAntes} de ${limite} reposições`)).toBeTruthy();
    await tocarNoBotao(app, 'Ver sugestões');

    // Passo 1: a disponibilidade do aluno. Dá para seguir sem marcar nada.
    expect(app.getByRole('header', { name: `Quando o ${nome} pode?` })).toBeTruthy();
    expect(app.getByText('Passo 1 de 3')).toBeTruthy();
    await tocarNoBotao(app, 'Ver sugestões');

    // Passo 2: as sugestões, com a melhor já marcada.
    expect(app.getByRole('header', { name: 'Escolher horário' })).toBeTruthy();
    expect(app.getByText('Passo 2 de 3')).toBeTruthy();
    expect(
      app.getByText(
        `${aluno.name} · validade ${aluno.validade} · ` +
          `${usadasAntes} de ${limite} reposições usadas`,
      ),
    ).toBeTruthy();
    const { dia, hora } = horarioMarcado(app);
    await tocarNoBotao(app, /^Propor /);

    // Passo 3: o que muda, dito antes de confirmar.
    expect(app.getByRole('header', { name: 'Confirmar reposição' })).toBeTruthy();
    expect(app.getByText('Passo 3 de 3')).toBeTruthy();
    expect(app.getByText(`${dia} · ${hora}`)).toBeTruthy();
    expect(app.getByText(`falta de ${falta}`)).toBeTruthy();
    expect(app.getByText(`${usadasDepois} de ${limite}`)).toBeTruthy();
    expect(app.getByText('sem alteração')).toBeTruthy();
    expect(
      app.getByLabelText(
        new RegExp(
          `^Mensagem: Oi, ${nome}!\\s+Consegui encaixar a reposição da sua aula em ` +
            `${semRegex(dia)}, às ${hora}\\.`,
        ),
      ),
    ).toBeTruthy();
    await tocarNoBotao(app, 'Confirmar e avisar o aluno');

    // A proposta foi enviada e espera a resposta. Ainda não conta como reposição.
    expect(app.getByText(`Proposta enviada para ${nome}: ${dia}, ${hora}.`)).toBeTruthy();
    expect(app.getByRole('header', { name: `${dia}, ${hora}` })).toBeTruthy();
    expect(app.getByText(`${nome} ainda não respondeu`)).toBeTruthy();
    await tocarNoBotao(app, 'Confirmar e marcar na agenda');

    // Marcada: o toast diz, e a ficha mostra a reposição contada e o saldo intacto.
    expect(app.getByText(`Reposição de ${nome} marcada para ${dia}, ${hora}.`)).toBeTruthy();
    expect(app.getByText('Reposição confirmada')).toBeTruthy();
    expect(app.getByText(`${dia}, ${hora}. Marcada na sua agenda.`)).toBeTruthy();
    expect(app.queryByText('Reposição pendente')).toBeNull();
    expect(app.queryByText('Proposta aguardando aceite')).toBeNull();
    expect(app.getByText(`${usadasDepois} de ${limite} reposições`)).toBeTruthy();
    expect(app.getByLabelText(restantes(saldo, aluno.total))).toBeTruthy();
    expect(
      app.getByLabelText(
        new RegExp(
          `\\. Reposição marcada\\. ${semRegex(dia)}, ${hora}\\. ` +
            `sem efeito no saldo\\. saldo ${saldo}$`,
        ),
      ),
    ).toBeTruthy();
  });

  it('trocar a sugestão no passo 2 muda o que os passos seguintes dizem', async () => {
    const aluno = alunoDaSemente('raf');
    const app = await abrirOApp();
    await abrirAFichaDe(app, aluno);
    await tocarNoBotao(app, 'Ver sugestões');
    await tocarNoBotao(app, 'Ver sugestões');

    const primeira = horarioMarcado(app);
    const outras = app.getAllByRole('radio', { checked: false });
    expect(outras.length).toBeGreaterThan(0);
    await fireEvent.press(outras[0]);
    const escolhida = horarioMarcado(app);
    expect(escolhida).not.toEqual(primeira);

    await tocarNoBotao(app, /^Propor /);
    expect(app.getByText(`${escolhida.dia} · ${escolhida.hora}`)).toBeTruthy();
    expect(app.queryByText(`${primeira.dia} · ${primeira.hora}`)).toBeNull();
  });

  // Defeito encontrado escrevendo este fluxo, em `estado/dados.ts`: marcar a
  // reposição direto ("Agendar sem avisar") não desfaz a proposta que estava
  // aberta. A ficha fica com "Reposição confirmada" e "Proposta aguardando
  // aceite" ao mesmo tempo, e aceitar a proposta depois conta uma segunda
  // reposição para a mesma falta. O Rafael da semente tem proposta aberta.
  it.failing('agendar direto não deixa a proposta antiga pendurada na ficha', async () => {
    const aluno = alunoDaSemente('raf');
    const app = await abrirOApp();
    await abrirAFichaDe(app, aluno);
    expect(app.getByText('Proposta aguardando aceite')).toBeTruthy();

    await tocarNoBotao(app, 'Ver sugestões');
    await tocarNoBotao(app, 'Ver sugestões');
    await tocarNoBotao(app, /^Propor /);
    await fireEvent.press(app.getByRole('switch', { name: 'Pedir confirmação dele' }));
    await tocarNoBotao(app, 'Agendar sem avisar');

    expect(app.getByText('Reposição confirmada')).toBeTruthy();
    expect(app.queryByText('Proposta aguardando aceite')).toBeNull();
  });
});
