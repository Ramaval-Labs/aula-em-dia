# web — Aula em Dia (versão para navegador)

É **a mesma aplicação do `../app`**, compilada para o navegador pelo Expo (`expo export --platform
web`). Não existe projeto web separado: o código é um só.

- **Produção:** **https://aula-em-dia-three.vercel.app**, publicada na Vercel a cada push na `main`,
  ligada ao Supabase da nuvem.
- **A página do aluno** mora aqui: `/a/<token>`. É o link que o professor manda ao aluno, sem login.
- **A pasta `dist/`** que vem neste zip já está compilada no **modo local**, com os dados de
  demonstração. Ela abre sem conta e sem backend.

## Pré-requisitos

| O quê | Versão | Para quê |
|---|---|---|
| **Node.js** | **22.x** | servir a pasta e, se quiser, compilar de novo |
| **npm** | o que vem com o Node 22 | |
| Um navegador | Chrome, Edge, Firefox ou Safari recentes | abrir o app |

## Dependências

**Para servir o `dist/` pronto, nenhuma:** o `npx serve` baixa o servidor estático na hora.

**Para compilar de novo:** as dependências do app (`cd ../app && npm install`).

## Variáveis de ambiente

As variáveis são lidas **na compilação** e ficam dentro do bundle. Tudo que começa com
`EXPO_PUBLIC_` é público. São as mesmas do app (detalhes em `../app/README.md`):

| Variável | No `dist/` deste zip | Em produção (Vercel) |
|---|---|---|
| `EXPO_PUBLIC_BACKEND` | `local` | `supabase` |
| `EXPO_PUBLIC_SUPABASE_URL` | vazia | a URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | vazia | a chave **pública** do projeto |
| `EXPO_PUBLIC_URL_DO_ALUNO` | vazia | `https://aula-em-dia-three.vercel.app` |
| `EXPO_PUBLIC_URL_DO_APP` | vazia | `https://aula-em-dia-three.vercel.app` |

Na Vercel, elas ficam em Project → Settings → Environment Variables.

## Executar

**Servir o que já vem compilado** (dentro desta pasta, `web/`):

```bash
npx serve -s dist
```

Abra o endereço que ele mostra, normalmente http://localhost:3000. O `-s` devolve o `index.html`
para qualquer rota, como a Vercel faz (`vercel.json`).

**Compilar de novo**, a partir do código do app:

```bash
cd ../app
npm install
cp .env.example .env            # ajuste as variáveis, se quiser o modo supabase
npx expo export --platform web  # gera ../app/dist
```

Depois sirva com `npx serve -s dist` dentro de `../app`, ou copie o `dist/` para cá.

## Verificar

- A tela de boas-vindas abre. Em **Entrar**, qualquer e-mail válido com senha de 6 caracteres ou
  mais leva aos 4 alunos de demonstração.
- Em produção, a página do aluno abre por um link `/a/<token>` gerado na ficha do aluno ("Enviar
  link do saldo").

---

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `dist/` | o app compilado: `index.html`, o JavaScript e os assets (fontes, ícones) |
| `vercel.json` | a configuração da Vercel: o comando de build (`npx expo export --platform web`), a pasta de saída (`dist`), a reescrita de todas as rotas para o `index.html` e os cabeçalhos da página do aluno (`noindex`, `no-referrer`) |
