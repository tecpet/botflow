/**
 * Log de diagnóstico para handlers do bloco tecpet.
 *
 * Os logs HTTP do SDK (`[tecpet-sdk] [HTTP] ...`) só mostram o que trafega na
 * rede. Este helper cobre o que fica invisível: inputs parseados das opções,
 * decisões de branch e contagens/ids do que é gravado nas variáveis do Typebot.
 *
 * Saída no formato `[tecpet-block] [<handler>] {<contexto JSON>}` para ser
 * facilmente filtrável no botflow-viewer (ex.: textPayload:"[tecpet-block]").
 */
export const logHandler = (
  handler: string,
  context: Record<string, unknown>,
): void => {
  try {
    const safe = JSON.stringify(context, (_key, value) => {
      if (typeof value === "string" && value.length > 300) {
        return `${value.slice(0, 300)}…(${value.length})`;
      }
      return value;
    });

    console.log(`[tecpet-block] [${handler}] ${safe}`);
  } catch {
    console.log(`[tecpet-block] [${handler}] <contexto não serializável>`);
  }
};

/** Resume um array para log: tamanho + amostra dos primeiros itens. */
export const summarizeArray = (value: unknown, sample = 5) => {
  if (!Array.isArray(value)) return { length: 0, sample: [] as unknown[] };
  return { length: value.length, sample: value.slice(0, sample) };
};
