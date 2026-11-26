# app — Aula em Dia (aplicativo do professor)

O aplicativo do professor, em **React Native + Expo** (SDK 58, TypeScript). Roda no celular pelo
**Expo Go** (iOS e Android) e no navegador.

## Pré-requisitos

| O quê | Versão | Para quê |
|---|---|---|
| **Node.js** | **22.x** (`.nvmrc`) | instalar e rodar |
| **npm** | o que vem com o Node 22 | |
| **Expo Go** no celular | a versão atual da loja (SDK 58) | abrir o app no aparelho |
| **Conta gratuita em [expo.dev](https://expo.dev/signup)** | — | desde o SDK 57, o Expo Go só abre o projeto com a **mesma conta** logada no terminal e no app |
| Chrome ou Edge | qualquer recente | só para rodar no navegador |

O celular e o computador precisam estar na **mesma rede Wi-Fi**. Em rede que bloqueia, use o modo
`--tunnel`, descrito em "Executar".

## Dependências

Dentro desta pasta (`app/`):

```bash
npm install
```

Isso instala tudo o que está no `package.json`: Expo, React Native, zustand, Supabase JS, Jest e
os demais.

## Variáveis de ambiente

Copie o exemplo e ajuste se precisar:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Exemplo | Para quê |
|---|---|---|---|
| `EXPO_PUBLIC_BACKEND` | não | `local` | `local` (padrão): roda **sem backend**, com dados de demonstração salvos no aparelho. `supabase`: login de verdade e dados na nuvem |
| `EXPO_PUBLIC_SUPABASE_URL` | só no modo `supabase` | `https://<projeto>.supabase.co` | o endereço da API (ver `../api/README.md`) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | só no modo `supabase` | `sb_publishable_...` | a chave **pública** do projeto. Nunca ponha aqui a service role |
| `EXPO_PUBLIC_URL_DO_ALUNO` | não | `https://aula-em-dia-three.vercel.app` | a base do link do aluno (`/a/<token>`) |
| `EXPO_PUBLIC_URL_DO_APP` | não | `https://aula-em-dia-three.vercel.app` | a base do link de redefinir senha |

**Para avaliar, não precisa de nada:** com o `.env` copiado do exemplo, o app abre no modo `local`.
- **Entrar** aceita qualquer e-mail válido com senha de 6 caracteres ou mais, e abre direto nos
  quatro alunos de demonstração.
- **Criar conta** passa pelos 4 passos do onboarding.

## Executar

**No celular, pelo Expo Go:**

```bash
npx expo login          # uma vez; é interativo (pede e-mail e senha da conta expo.dev)
npx expo start --clear  # mostra um QR Code
```

- **iPhone:** aponte a câmera para o QR Code.
- **Android:** no Expo Go, toque em "Scan QR code".
- Se a rede bloquear a conexão, rode `npx expo start --tunnel`.

**No navegador** (não exige login no Expo):

```bash
npx expo start --web
```

O app abre em `http://localhost:8081`.

## Verificar

```bash
npm test             # 1330 testes: regras de negócio, navegação, tokens e as 37 telas
npm run typecheck    # TypeScript sem erros
npm run lint         # ESLint
```

Os três devem terminar sem erro. No `npm test`, confira o código de saída, e não só o resumo.

**No app**, o modo local abre na lista de **Alunos** com 4 alunos de demonstração. Toque em
**Registrar aula** e escolha um aluno: o efeito no saldo aparece antes de confirmar.

---

## Sobre o código

```
src/dominio/     regras de negócio puras e testadas: política de faltas, motor de reposição,
                 pacote, pagamento, avisos, datas
src/telas/       as 37 telas (entrada, alunos, registro, reposição, financeiro, ajustes, aluno)
src/componentes/ o design system (vidro, listas, campos, grade de horários) e o catálogo
src/estado/      os estados: dados, sessão, navegação, rascunhos de formulário
src/dados/       a persistência: local (AsyncStorage) ou Supabase, e o conversor para o banco
src/tema/        tokens, tipografia e movimento
scripts/         capturar telas (npm run capturar) e utilitários
```

**Outros comandos:**
- `npm run bundle:dominio` empacota o domínio para as funções da `../api` (ver o README de lá).
- `npm run capturar -- --tela home` tira um print de uma tela pelo navegador.

O que cada tela faz, as regras de negócio e a arquitetura estão em `../docs/PROJETO.md`. As
decisões de implementação (stack, estado, navegação, convenções) estão em `DESENVOLVIMENTO.md`.

**Problemas comuns:**
- **"You need to be signed in to Expo Go and Expo CLI":** logue a mesma conta no terminal
  (`npx expo login`) e no Expo Go.
- **O app mostra uma versão antiga:** pare o servidor e rode `npx expo start --clear`.
- **A porta 8081 está ocupada:** responda `Y` quando o Expo oferecer outra porta.
