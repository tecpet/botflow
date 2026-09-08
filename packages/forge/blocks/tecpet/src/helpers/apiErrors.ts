/**
 * Códigos de erro que a Public API devolve no corpo da resposta e que o fluxo
 * precisa distinguir de uma falha genérica. O `HttpClient` do SDK repassa o
 * corpo cru do erro (`throw error.response.data`), então o que chega aqui é o
 * payload padrão do NestJS: `{ statusCode, message, error }`.
 *
 * O enum vive no bloco (e não no SDK) para não amarrar cada código novo a uma
 * publicação de versão do `@tec.pet/tecpet-sdk` — mesma decisão tomada no
 * communication-gateway, em `src/domain/constants/tecpet-api-errors.ts`.
 */
export enum TecpetApiError {
  BOOKING_IS_PAID_AND_CANNOT_BE_CANCELED = "BOOKING_IS_PAID_AND_CANNOT_BE_CANCELED",
  BOOKING_DATE_AFTER_PET_PLAN_END_DATE = "BOOKING_DATE_AFTER_PET_PLAN_END_DATE",
  BOOKING_DATE_BEFORE_PET_PLAN_START_DATE = "BOOKING_DATE_BEFORE_PET_PLAN_START_DATE",
  PET_PLAN_IS_CANCELED = "PET_PLAN_IS_CANCELED",
  /**
   * Código de negócio novo da Public API (TP-4219): o pet já tem compromisso que
   * se sobrepõe ao horário escolhido, em qualquer segmento da loja.
   */
  PET_ALREADY_BOOKED_AT_TIME = "PET_ALREADY_BOOKED_AT_TIME",
  /**
   * Mensagem crua que o `createBooking` do servidor lança e que, antes da
   * TP-4219, chegava aqui embrulhada num 500. Mantida na lista para o bloco
   * reconhecer o conflito também nas versões da API anteriores ao deploy do
   * código acima.
   */
  TIME_ALREADY_ALLOCATED = "TIME_ALREADY_ALLOCATED",
}

/**
 * O `message` pode vir como string ou como array (validações do class-validator),
 * por isso a checagem cobre os dois formatos em vez de comparar por igualdade.
 *
 * O `code` é conferido antes: os erros de negócio da Public API
 * (`PublicApiBusinessError`) devolvem `{ code, message, statusCode }`, e nesses o
 * identificador está no `code` — o `message` traz só o texto para o cliente.
 * Erros lançados como `ForbiddenException('CODIGO')` continuam chegando pelo
 * `message`, que é o caso dos códigos de plano da TP-4050.
 */
export const isTecpetApiError = (
  error: unknown,
  apiError: TecpetApiError,
): boolean => {
  const code = (error as { code?: unknown })?.code;

  if (typeof code === "string" && code === apiError) return true;

  const message = (error as { message?: unknown })?.message ?? error;

  if (typeof message === "string") return message.includes(apiError);

  if (Array.isArray(message))
    return message.some(
      (item) => typeof item === "string" && item.includes(apiError),
    );

  return false;
};

/**
 * O `HttpClient` do SDK repassa o corpo cru do erro (`throw error.response.data`),
 * então o que chega ao catch normalmente é um objeto simples — e não um `Error`.
 * Sem isso, `String(error)` cai em `"[object Object]"` e o log do fluxo perde
 * justamente a mensagem da API (foi o que dificultou o diagnóstico da TP-4050).
 */
export const describeApiError = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  const message = (error as { message?: unknown })?.message;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join("; ");

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};
