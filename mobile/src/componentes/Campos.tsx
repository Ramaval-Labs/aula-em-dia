/**
 * Campo de texto do iOS Glass — **derivado**: o handoff não desenha
 * formulário nenhum ("O que deliberadamente não está no design"), mas o app
 * tem login, cadastro de aluno, chave Pix e perfil.
 *
 * Como foi derivado, no idioma do sistema:
 * - trilho em `preenchimento`, o mesmo fundo do trilho do segmentado e do
 *   stepper — é o que o handoff usa para "campo de controle";
 * - raio 13 e altura 50, a escala do botão inline e do secundário compacto;
 * - rótulo acima em 11.5/600 `.04em` caixa alta `tinta3`, o mesmo do
 *   sub-cabeçalho "ANTECEDÊNCIA DO AVISO" da tela Registrar;
 * - foco: borda de 1px em tint (o handoff não tem estado de foco; o tint é a
 *   cor de interação do sistema);
 * - erro: borda e mensagem em `vermelho`, com a mensagem como live region —
 *   o handoff diz "não há mensagem de erro em nenhum formulário", mas os
 *   formulários do app validam (`dominio/validacao.ts`).
 *
 * `textoDeCampo()` no lugar de `texto()`: a compensação de margem da
 * tipografia é para `<Text>` em fluxo e desloca o texto dentro do
 * `TextInput`.
 */

import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { DIAS, DIAS_DA_SEMANA } from '../dominio/disponibilidade';
import { dinheiro, lerDinheiro } from '../dominio/formato';
import type { DiaDaSemana } from '../dominio/tipos';
import { folgaDeToque } from '../tema/alvoDeToque';
import { useCores } from '../tema/TemaProvider';
import { comEspaco, texto, textoDeCampo } from '../tema/tipografia';
import { PAD, RAIO, TAMANHO } from '../tema/tokens';
import { useAnuncio } from './anunciar';
import { FichaDeEscolha, OPACIDADE_PRESSIONADO } from './Controles';

export type TipoDeTeclado = 'texto' | 'email' | 'numerico' | 'decimal' | 'telefone';

/**
 * Só na web: o navegador desenha o anel de foco em `outline-style: auto`, que
 * ignora a largura, então só o `none` o tira. O tipo do React Native aceita
 * só solid, dotted e dashed; o react-native-web aceita o `none`.
 */
const SEM_CONTORNO_NA_WEB = { outlineStyle: 'none' } as unknown as TextStyle;

const TECLADOS: Record<TipoDeTeclado, KeyboardTypeOptions> = {
  texto: 'default',
  email: 'email-address',
  // o `number-pad` do iOS não tem separador; o `decimal-pad` traz a vírgula
  // (ou o ponto, conforme a região do aparelho — `lerDinheiro` lê os dois)
  numerico: 'number-pad',
  decimal: 'decimal-pad',
  telefone: 'phone-pad',
};

/** Altura do campo de várias linhas (3 linhas de 15.5px + padding). */
const ALTURA_MULTILINHA = 96;

export function CampoDeTexto({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  senha = false,
  teclado = 'texto',
  erro,
  ajuda,
  autoFoco = false,
  capitalizar = 'sentences',
  multilinha = false,
  sufixo,
  aoEnviar,
  aoSair,
  editavel = true,
  estilo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  senha?: boolean;
  teclado?: TipoDeTeclado;
  /** mensagem de erro — pinta o campo e é lida como live region */
  erro?: string;
  /** dica fixa sob o campo, quando não há erro */
  ajuda?: string;
  autoFoco?: boolean;
  capitalizar?: 'none' | 'sentences' | 'words';
  multilinha?: boolean;
  /** ação à direita dentro do trilho ("mostrar" da senha) */
  sufixo?: React.ReactNode;
  aoEnviar?: () => void;
  /** o campo perdeu o foco — quem valida no fim da digitação escuta aqui */
  aoSair?: () => void;
  /** false: só leitura — o texto vai para `tinta2` e o teclado não abre */
  editavel?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { cores } = useCores();
  const [focado, setFocado] = useState(false);
  // A live region não existe no iOS: lá o erro novo é anunciado.
  useAnuncio(erro ? `${rotulo}: ${erro}` : undefined);
  const corDaBorda = erro ? cores.vermelho : focado ? cores.tint : 'transparent';

  return (
    <View style={estilo}>
      <Text
        style={[
          texto(11.5, 600, { tracking: 0.04, maiuscula: true }),
          { color: erro ? cores.vermelhoTexto : cores.tinta3 },
        ]}
      >
        {rotulo}
      </Text>

      <View
        style={[
          estilos.trilho,
          {
            marginTop: 8,
            backgroundColor: cores.preenchimento,
            borderColor: corDaBorda,
            minHeight: multilinha ? ALTURA_MULTILINHA : TAMANHO.campo,
            alignItems: multilinha ? 'flex-start' : 'center',
            paddingVertical: multilinha ? 13 : 0,
          },
        ]}
      >
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          placeholder={placeholder}
          placeholderTextColor={cores.tinta3}
          secureTextEntry={senha}
          keyboardType={TECLADOS[teclado]}
          autoCapitalize={teclado === 'email' ? 'none' : capitalizar}
          autoCorrect={teclado !== 'email'}
          autoFocus={autoFoco}
          editable={editavel}
          multiline={multilinha}
          onFocus={() => setFocado(true)}
          onBlur={() => {
            setFocado(false);
            aoSair?.();
          }}
          onSubmitEditing={aoEnviar}
          returnKeyType={aoEnviar ? 'done' : undefined}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? ajuda}
          selectionColor={cores.tint}
          style={[
            textoDeCampo(15.5, senha ? 600 : 500, {
              altura: 1.3,
              tracking: senha && valor ? 0.18 : undefined,
              tabular: teclado === 'numerico' || teclado === 'decimal' || teclado === 'telefone',
            }),
            estilos.entrada,
            // No navegador o campo ganhava o contorno de foco preto por dentro do
            // trilho, duplicando a borda de 1px em tint, que é o indicador de foco.
            Platform.OS === 'web' ? SEM_CONTORNO_NA_WEB : null,
            {
              color: editavel ? cores.tinta : cores.tinta2,
              textAlignVertical: multilinha ? 'top' : 'center',
            },
          ]}
        />
        {sufixo}
      </View>

      {erro ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            comEspaco(texto(12, 500, { altura: 1.4 }), { topo: 6 }),
            estilos.nota,
            { color: cores.vermelhoTexto },
          ]}
        >
          {erro}
        </Text>
      ) : ajuda ? (
        <Text
          style={[
            comEspaco(texto(12, 500, { altura: 1.4 }), { topo: 6 }),
            estilos.nota,
            { color: cores.tinta2 },
          ]}
        >
          {ajuda}
        </Text>
      ) : null}
    </View>
  );
}

const ERRO_DE_DINHEIRO = 'Valor inválido. Use números, como 62,50.';

/** O que `useCampoDeDinheiro` entrega para espalhar no `CampoDeDinheiro`. */
export interface EstadoDoCampoDeDinheiro {
  digitado: string;
  aoDigitar: (v: string) => void;
  aoSair: () => void;
  erro?: string;
}

/**
 * Estado do campo de dinheiro. O texto digitado mora aqui, separado do valor:
 * no meio da digitação ("62,") ele ainda não é um valor, e não pode zerar o
 * que estava salvo. `aoMudar` só é chamado com valor lido.
 *
 * O erro não aparece enquanto a pessoa digita — só ao sair do campo ou quando
 * a tela chama `confirmar()` antes de gravar. Senão o leitor de tela anunciaria
 * erro a cada tecla.
 */
export function useCampoDeDinheiro(
  reais: number,
  aoMudar: (reais: number) => void,
): { campo: EstadoDoCampoDeDinheiro; confirmar: () => boolean } {
  const [digitado, setDigitado] = useState(() => dinheiro(reais));
  const [revelado, setRevelado] = useState(false);
  const invalido = lerDinheiro(digitado) === null;

  const aoDigitar = (v: string) => {
    setDigitado(v);
    setRevelado(false);
    const centavos = lerDinheiro(v);
    // `lerDinheiro` devolve centavos; `ConfigPacote.valorPorAula` guarda reais
    // até o backend (`valor_por_aula_centavos`). Esta divisão é a borda: é
    // aqui que o bug do 100× volta se alguém trocar a unidade de um dos lados.
    if (centavos !== null) aoMudar(centavos / 100);
  };

  return {
    campo: {
      digitado,
      aoDigitar,
      aoSair: () => setRevelado(true),
      erro: revelado && invalido ? ERRO_DE_DINHEIRO : undefined,
    },
    confirmar: () => {
      setRevelado(true);
      return !invalido;
    },
  };
}

/**
 * Campo de valor em reais: abre com `dinheiro()` ("R$ 80,00"), aceita
 * vírgula ou ponto pelo teclado decimal e lê com `lerDinheiro`. O estado vem
 * de `useCampoDeDinheiro`, na tela que grava.
 */
export function CampoDeDinheiro({
  rotulo,
  digitado,
  aoDigitar,
  aoSair,
  erro,
  ajuda,
  estilo,
}: EstadoDoCampoDeDinheiro & {
  rotulo: string;
  ajuda?: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <CampoDeTexto
      rotulo={rotulo}
      valor={digitado}
      aoMudar={aoDigitar}
      aoSair={aoSair}
      erro={erro}
      ajuda={ajuda}
      teclado="decimal"
      capitalizar="none"
      estilo={estilo}
    />
  );
}

/**
 * Ação de texto em tint para o `sufixo` do campo: "mostrar"/"ocultar" da
 * senha, "copiar" da chave Pix. Ocupa 44 de altura, a faixa inteira do
 * trilho; no Android a folga leva o toque a 48.
 */
export function AcaoDoCampo({
  rotulo,
  aoTocar,
  rotuloAcessivel,
}: {
  rotulo: string;
  aoTocar: () => void;
  /** o que o leitor de tela diz ("Mostrar senha"), quando o rótulo é curto */
  rotuloAcessivel?: string;
}) {
  const { cores } = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      onPress={aoTocar}
      hitSlop={{ ...folgaDeToque(TAMANHO.alvoMinimo), left: 10, right: 10 }}
      style={({ pressed }) => [estilos.acao, { opacity: pressed ? OPACIDADE_PRESSIONADO : 1 }]}
    >
      <Text style={[texto(13.5, 600), { color: cores.tint }]}>{rotulo}</Text>
    </Pressable>
  );
}

/* ── Seletor de dias ──────────────────────────────────────────────────── */

/** "SEG" → "Seg", "SÁB" → "Sáb": a ficha é estreita, o nome longo vai para o leitor de tela. */
const curtoDe = (curto: string) => curto[0] + curto.slice(1).toLowerCase();

/** As disciplinas sugeridas ao professor; "+ outra" acrescenta qualquer uma. */
export const DISCIPLINAS_SUGERIDAS: readonly string[] = [
  'Inglês',
  'Violão',
  'Matemática',
  'Música',
  'Reforço escolar',
];

/**
 * As disciplinas do professor (SCRUM-39) — derivado: fichas de escolha
 * múltipla com as sugestões e as que ele já acrescentou, e a ficha "+ outra"
 * da referência (Fluxo A), que abre um campo logo abaixo. O que for digitado
 * vira ficha marcada; digitar uma que já existe só a marca; enviar vazio fecha
 * o campo. A mesma peça no onboarding (passo 1) e em Meu perfil, onde antes
 * havia um campo de texto separado por vírgula.
 */
export function SeletorDeDisciplinas({
  disciplinas,
  aoMudar,
  rotulo,
  rotuloDoGrupo,
  sugestoes = DISCIPLINAS_SUGERIDAS,
}: {
  disciplinas: string[];
  aoMudar: (disciplinas: string[]) => void;
  /** rótulo em caixa alta acima, como o do campo de texto (Meu perfil) */
  rotulo?: string;
  /** o que o leitor de tela diz da lista, quando o título está fora dela */
  rotuloDoGrupo?: string;
  sugestoes?: readonly string[];
}) {
  const { cores } = useCores();
  // O campo aberto e o texto em digitação morrem com a tela; a lista é de quem chama.
  const [aberta, setAberta] = useState(false);
  const [outra, setOutra] = useState('');
  const fichas = [...sugestoes, ...disciplinas.filter((d) => !sugestoes.includes(d))];

  const alternar = (d: string) =>
    aoMudar(disciplinas.includes(d) ? disciplinas.filter((x) => x !== d) : [...disciplinas, d]);

  const acrescentar = () => {
    const nova = outra.trim();
    // `toLowerCase`, e não o local: o Hermes nem sempre traz ICU completo.
    const existente = nova
      ? fichas.find((d) => d.toLowerCase() === nova.toLowerCase())
      : undefined;
    if (existente) {
      if (!disciplinas.includes(existente)) aoMudar([...disciplinas, existente]);
    } else if (nova) {
      aoMudar([...disciplinas, nova]);
    }
    setOutra('');
    setAberta(false);
  };

  return (
    <View style={estilos.disciplinas}>
      <View>
        {rotulo ? (
          <Text
            style={[
              texto(11.5, 600, { tracking: 0.04, maiuscula: true }),
              { color: cores.tinta3 },
            ]}
          >
            {rotulo}
          </Text>
        ) : null}
        <View
          accessibilityRole="list"
          accessibilityLabel={rotuloDoGrupo ?? rotulo}
          style={[estilos.fichasDeDisciplina, rotulo ? estilos.aposRotulo : null]}
        >
          {fichas.map((d) => (
            <FichaDeEscolha
              key={d}
              rotulo={d}
              marcada={disciplinas.includes(d)}
              aoTocar={() => alternar(d)}
            />
          ))}
          {aberta ? null : (
            <FichaDeEscolha
              rotulo="+ outra"
              rotuloAcessivel="Acrescentar outra disciplina"
              marcada={false}
              aoTocar={() => setAberta(true)}
            />
          )}
        </View>
      </View>
      {aberta ? (
        <CampoDeTexto
          rotulo="Outra disciplina"
          valor={outra}
          aoMudar={setOutra}
          placeholder="Piano, Espanhol…"
          capitalizar="words"
          autoFoco
          aoEnviar={acrescentar}
          sufixo={<AcaoDoCampo rotulo="incluir" aoTocar={acrescentar} />}
        />
      ) : null}
    </View>
  );
}

/**
 * Os dias da aula fixa (SCRUM-90) — derivado: uma fileira de `FichaDeEscolha`
 * de segunda a sábado, a mesma semana da grade do professor
 * (`DIAS_DA_SEMANA`), sob o mesmo rótulo do campo de texto. As seis fichas
 * dividem a largura. Escolha múltipla; nenhuma marcada é "sem horário fixo".
 * Os dias saem sempre na ordem da semana, qualquer que seja a ordem do toque.
 */
export function SeletorDeDias({
  rotulo,
  dias,
  aoMudar,
  ajuda,
}: {
  rotulo: string;
  dias: DiaDaSemana[];
  aoMudar: (dias: DiaDaSemana[]) => void;
  /** dica fixa sob a fileira */
  ajuda?: string;
}) {
  const { cores } = useCores();
  const alternar = (dia: DiaDaSemana) => {
    const proximo = dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia];
    aoMudar(DIAS_DA_SEMANA.filter((d) => proximo.includes(d)));
  };

  return (
    <View>
      <Text
        style={[
          texto(11.5, 600, { tracking: 0.04, maiuscula: true }),
          { color: cores.tinta3 },
        ]}
      >
        {rotulo}
      </Text>
      <View style={estilos.fileiraDeDias}>
        {DIAS_DA_SEMANA.map((dia) => {
          const nomes = DIAS.find((d) => d.chave === dia);
          return (
            <FichaDeEscolha
              key={dia}
              rotulo={curtoDe(nomes?.curto ?? dia)}
              rotuloAcessivel={nomes?.longo ?? dia}
              marcada={dias.includes(dia)}
              aoTocar={() => alternar(dia)}
              estilo={estilos.fichaDeDia}
            />
          );
        })}
      </View>
      {ajuda ? (
        <Text
          style={[
            comEspaco(texto(12, 500, { altura: 1.4 }), { topo: 6 }),
            estilos.nota,
            { color: cores.tinta2 },
          ]}
        >
          {ajuda}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fileiraDeDias: { flexDirection: 'row', gap: 6, marginTop: 8 },
  // 12: o vão dos formulários, entre as fichas e o campo de "+ outra"
  disciplinas: { gap: 12 },
  fichasDeDisciplina: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // o mesmo respiro do rótulo para a fileira de dias
  aposRotulo: { marginTop: 8 },
  // as seis dividem a largura: o padding lateral da ficha não cabe seis vezes
  fichaDeDia: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
  acao: { height: TAMANHO.alvoMinimo, justifyContent: 'center' },
  trilho: {
    borderRadius: RAIO.botaoInline,
    borderWidth: 1,
    ...PAD.campo,
    flexDirection: 'row',
    gap: 10,
  },
  entrada: { flex: 1, minWidth: 0 },
  // 2px: a dica alinha com o texto digitado, não com a borda do trilho
  nota: { paddingHorizontal: 2 },
});
