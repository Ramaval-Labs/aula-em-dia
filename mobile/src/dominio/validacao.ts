/**
 * Validação de formulário — módulo puro.
 *
 * As mensagens de erro saem daqui porque aparecem na tela; conferir string a
 * string no teste é o mesmo contrato de `politica.ts`.
 */

/** Aceita o que o servidor de e-mail aceitaria sem drama: algo@algo.algo */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const SENHA_MINIMA = 6;

export function emailValido(v: string): boolean {
  return EMAIL.test(v.trim());
}

export function senhaValida(v: string): boolean {
  return v.length >= SENHA_MINIMA;
}

export function nomeValido(v: string): boolean {
  return v.trim().length >= 2;
}

/** Só dígitos. Fixo com DDD tem 10; celular tem 11. */
export function telefoneValido(v: string): boolean {
  const d = somenteDigitos(v);
  return d.length === 10 || d.length === 11;
}

export const somenteDigitos = (v: string): string => v.replace(/\D/g, '');

/** "51999994182" → "(51) 99999-4182". Formata o que já tem, sem forçar. */
export function formatarTelefone(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length > 8 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** "Camila Torres" → "CT". Uma letra quando o nome tem uma palavra só. */
export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export type Erros<T> = Partial<Record<keyof T, string>>;

/** Mensagens de erro, num lugar só. */
export const ERRO = {
  emailVazio: 'Informe seu e-mail',
  emailInvalido: 'Esse e-mail não parece certo',
  senhaVazia: 'Informe sua senha',
  senhaCurta: `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres`,
  nomeVazio: 'Informe o nome',
  nomeCurto: 'O nome está curto demais',
  disciplinaVazia: 'Escolha pelo menos uma disciplina',
  telefoneInvalido: 'Telefone incompleto',
  // Quando o login de verdade falha. Qual erro do Supabase vira qual frase é
  // decidido em estado/sessao.ts, na fronteira com o banco: o domínio só tem o texto.
  credenciaisInvalidas: 'E-mail ou senha não conferem',
  emailJaCadastrado: 'Já existe uma conta com esse e-mail',
  semConexao: 'Sem conexão. Confira a internet e tente de novo',
  falhaNoAcesso: 'Não deu para entrar agora. Tente de novo em instantes',
  avisoVazio: 'Informe com quantas horas ele avisou',
  avisoInvalido: 'Use só o número de horas, como 24',
  avisoAlto: 'Use até 720 horas (30 dias)',
  prazoZero: 'Use pelo menos 1 hora',
  prazoVazio: 'Informe o prazo em horas',
} as const;

/** O aviso mais longo que a tela aceita: 30 dias. Acima disso é engano de digitação. */
export const LIMITE_HORAS_DE_AVISO = 720;

/**
 * A antecedência do aviso de falta, como o professor digitou (SCRUM-101):
 * horas inteiras, de 0 a 720. "0" vale: o aluno avisou na hora da aula.
 */
export function horasDeAvisoDigitadas(textoDigitado: string): { horas: number } | { erro: string } {
  const t = textoDigitado.trim();
  if (!t) return { erro: ERRO.avisoVazio };
  if (!/^\d+$/.test(t)) return { erro: ERRO.avisoInvalido };
  const horas = Number(t);
  return horas > LIMITE_HORAS_DE_AVISO ? { erro: ERRO.avisoAlto } : { horas };
}

/**
 * O prazo mínimo de aviso da política, como o professor digitou (SCRUM-101):
 * de 1 a 720 horas. Zero não vale: "aviso com 0h" não é aviso, e quem quer
 * aceitar qualquer aviso põe 1h.
 */
export function prazoMinimoDigitado(textoDigitado: string): { horas: number } | { erro: string } {
  if (!textoDigitado.trim()) return { erro: ERRO.prazoVazio };
  const lido = horasDeAvisoDigitadas(textoDigitado);
  return 'horas' in lido && lido.horas < 1 ? { erro: ERRO.prazoZero } : lido;
}

export function validarAcesso(email: string, senha: string): Erros<{
  email: string;
  senha: string;
}> {
  const erros: Erros<{ email: string; senha: string }> = {};
  if (!email.trim()) erros.email = ERRO.emailVazio;
  else if (!emailValido(email)) erros.email = ERRO.emailInvalido;
  if (!senha) erros.senha = ERRO.senhaVazia;
  else if (!senhaValida(senha)) erros.senha = ERRO.senhaCurta;
  return erros;
}

export const semErros = (e: Erros<Record<string, unknown>>): boolean =>
  Object.keys(e).length === 0;
