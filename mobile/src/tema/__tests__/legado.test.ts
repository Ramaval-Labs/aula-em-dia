/**
 * A direção anterior (tinta chapada: amarelo, curvas, cabeçalho escuro) saiu
 * do sistema na Onda 4 do redesign iOS Glass. Este teste impede que ela
 * volte por cópia de código antigo: nenhum arquivo de `src/` pode citar o
 * amarelo da marca, os componentes de curva ou o token `MARCA`.
 *
 * Os padrões são montados por partes para este arquivo não acusar a si mesmo.
 */

// O projeto não traz os tipos do Node (o app é React Native): o mínimo que o
// teste usa vem declarado aqui.
declare const __dirname: string;
type Entrada = { name: string; isDirectory: () => boolean };
const fs: {
  readdirSync: (dir: string, o: { withFileTypes: true }) => Entrada[];
  readFileSync: (arquivo: string, codificacao: 'utf8') => string;
} = require('fs');
const path: {
  join: (...partes: string[]) => string;
  resolve: (...partes: string[]) => string;
  relative: (de: string, para: string) => string;
} = require('path');

const RAIZ = path.resolve(__dirname, '../..');

/** O hex vale em qualquer caixa; os nomes, como escritos no código. */
const PROIBIDOS: { padrao: string; qualquerCaixa: boolean }[] = [
  { padrao: '#' + 'FFD032', qualquerCaixa: true },
  { padrao: 'Curva' + 'Cabecalho', qualquerCaixa: false },
  { padrao: 'FaixaCurva' + 'Navbar', qualquerCaixa: false },
  { padrao: 'MARCA' + '.', qualquerCaixa: false },
];

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = path.join(dir, e.name);
    if (e.isDirectory()) return arquivos(caminho);
    return /\.(ts|tsx|js|jsx|json)$/.test(e.name) ? [caminho] : [];
  });
}

describe('sistema visual antigo', () => {
  const todos = arquivos(RAIZ);

  it('varre os arquivos de src/', () => {
    expect(todos.length).toBeGreaterThan(50);
  });

  it.each(PROIBIDOS)('nenhum arquivo de src/ contém $padrao', ({ padrao, qualquerCaixa }) => {
    const achados = todos
      .filter((f) => {
        const conteudo = fs.readFileSync(f, 'utf8');
        return qualquerCaixa
          ? conteudo.toUpperCase().includes(padrao.toUpperCase())
          : conteudo.includes(padrao);
      })
      .map((f) => path.relative(RAIZ, f));
    expect(achados).toEqual([]);
  });
});
