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
}

/**
 * O `message` pode vir como string ou como array (validações do class-validator),
 * por isso a checagem cobre os dois formatos em vez de comparar por igualdade.
 */
export const isTecpetApiError = (
  error: unknown,
  apiError: TecpetApiError,
): boolean => {
  const message = (error as { message?: unknown })?.message ?? error;

  if (typeof message === "string") return message.includes(apiError);

  if (Array.isArray(message))
    return message.some(
      (item) => typeof item === "string" && item.includes(apiError),
    );

  return false;
};
