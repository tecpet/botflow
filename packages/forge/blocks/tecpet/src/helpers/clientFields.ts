import { validateCpf } from "@tec.pet/tecpet-sdk";

/**
 * Limpeza dos campos que o bot grava no cadastro do cliente.
 *
 * A Public API valida o corpo do `PUT /v1/client/:id` com o `ValidationPipe`
 * global: `name` precisa de 3+ caracteres e `cpf` de exatamente 11 dígitos.
 * O `@IsOptional()` só pula `null`/`undefined`, então mandar `""` derruba a
 * edição inteira com 400. Entre 10 e 24/10/2026, 52 de 92 edições do bot
 * falharam assim (TP-4952): CPF digitado com pontos e traço, CPF vazio no
 * caminho de correção do nome e nome vazio no caminho do CPF.
 */

const stripAccents = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "");

const toKey = (value: string) =>
  stripAccents(value)
    .toLowerCase()
    .replace(/[.!?,;:]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const onlyDigits = (value: unknown): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value).replace(/\D/g, "")
    : "";

/**
 * Títulos de botão que chegam como texto quando o cliente toca num botão de
 * uma mensagem anterior. Em "Qual o nome correto?", o toque no "Sim" da
 * pergunta de confirmação virava o nome do cliente: 5 cadastros ficaram com
 * nome "Sim" entre 10 e 24/10/2026.
 */
const BUTTON_ANSWERS = new Set([
  "sim",
  "nao",
  "s",
  "n",
  "ok",
  "mais tarde",
  "pular",
  "voltar",
  "digitar outro cep",
]);

/** Nome que pode ir para a API, ou `undefined` quando não deve ser enviado. */
export const sanitizeClientName = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const name = value.replace(/\s+/g, " ").trim();
  if (name.length < 3) return undefined;
  if (BUTTON_ANSWERS.has(toKey(name))) return undefined;
  return name;
};

/** CPF com 11 dígitos válidos, ou `undefined` quando não deve ser enviado. */
export const sanitizeCpf = (value: unknown): string | undefined => {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return undefined;
  return validateCpf(digits) ? digits : undefined;
};

export const isButtonAnswer = (value: unknown): boolean =>
  typeof value === "string" && BUTTON_ANSWERS.has(toKey(value));

export { stripAccents, toKey };
