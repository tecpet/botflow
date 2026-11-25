/**
 * Paginação da lista do seletor de horários.
 *
 * A lista do WhatsApp na Meta aceita no máximo 10 linhas. Acima disso o gateway
 * divide a lista em várias mensagens "(1/N)", e "PREFIRO OUTRA DATA", que vem
 * por último, sobra sozinho na última: uma grade de 30 em 30 min das 08h às 18h
 * nos dois dias da janela virava 5 listas seguidas.
 *
 * No modo de exibição SMART (TP-5338), a lista mostra uma página por vez:
 * - os dias da janela dividem a página por igual, e o dia com menos horários
 *   que a sua parte cede o resto para o outro;
 * - dentro do dia os horários são espalhados (um a cada N), para a primeira
 *   página já cobrir manhã e tarde; as páginas seguintes trazem os do meio.
 *
 * Sem estado: a página é recalculada da lista completa e do número da página,
 * que dá a volta depois da última. Assim o cliente nunca fica preso no fim.
 */

type DatedTime = { dateISO?: string; dateBR?: string };

export type TimesPage<T> = {
  times: T[];
  /** Página exibida, já normalizada para `0..pageCount - 1`. */
  pageIndex: number;
  /** Mais de uma página = a lista precisa da opção "VER MAIS HORÁRIOS". */
  pageCount: number;
};

/**
 * Número da página vindo do fluxo. O Typebot injeta a variável como string, e
 * variável vazia chega como "" ou "null": tudo que não é inteiro positivo é a
 * primeira página.
 */
export const normalizeTimesPage = (raw: unknown): number => {
  const page = Math.trunc(Number(raw));

  return Number.isFinite(page) && page > 0 ? page : 0;
};

/** Linhas da lista do WhatsApp na Meta, contando as opções fixas. */
export const SMART_LIST_MAX_OPTIONS = 10;

/** Agrupa por dia, mantendo a ordem de chegada dos dias e dos horários. */
const groupByDay = <T extends DatedTime>(times: T[]): T[][] => {
  const days = new Map<string, T[]>();

  for (const time of times) {
    const key = time.dateISO || time.dateBR || "";
    const day = days.get(key);

    if (day) day.push(time);
    else days.set(key, [time]);
  }

  return [...days.values()];
};

/** Distribui as linhas entre os dias, uma por vez, sem passar do que o dia tem. */
const splitSlotsByDay = (dayLengths: number[], slots: number): number[] => {
  const quotas = dayLengths.map(() => 0);
  let remaining = slots;

  while (remaining > 0) {
    let assigned = false;

    for (let day = 0; day < dayLengths.length && remaining > 0; day++) {
      if (quotas[day] < dayLengths[day]) {
        quotas[day]++;
        remaining--;
        assigned = true;
      }
    }

    if (!assigned) break;
  }

  return quotas;
};

/**
 * Devolve os horários da página `page`.
 *
 * `maxTimes` é quantas linhas sobram para horários depois das opções fixas
 * ("PREFIRO OUTRA DATA" etc.). Se tudo cabe, a lista vai inteira. Se não cabe,
 * uma linha fica para "VER MAIS HORÁRIOS", e cada página leva até
 * `maxTimes - 1` horários.
 *
 * A ordem de entrada é preservada dentro da página (o `getAvailableTimes` e o
 * `getGroupAvailableTimes` já entregam por data e horário).
 */
export const paginateTimes = <T extends DatedTime>(
  times: T[],
  { maxTimes, page }: { maxTimes: number; page: number },
): TimesPage<T> => {
  if (times.length <= maxTimes) return { times, pageIndex: 0, pageCount: 1 };

  const slots = Math.max(1, Math.floor(maxTimes) - 1);
  const days = groupByDay(times);
  const quotas = splitSlotsByDay(
    days.map((day) => day.length),
    slots,
  );

  // Mais dias que linhas: não acontece na janela de dois dias, mas sem cota
  // para todos os dias a divisão por dia não fecha. A lista segue em ordem.
  if (quotas.some((quota) => quota === 0)) {
    const pageCount = Math.ceil(times.length / slots);
    const pageIndex = page % pageCount;

    return {
      times: times.slice(pageIndex * slots, (pageIndex + 1) * slots),
      pageIndex,
      pageCount,
    };
  }

  // Cada dia ocupa `ceil(horários / cota)` páginas, e a página p leva os
  // horários p, p + k, p + 2k... do dia. Nenhuma página passa da cota do dia, e
  // todo horário aparece em exatamente uma página.
  const dayPageCounts = days.map((day, index) =>
    Math.ceil(day.length / quotas[index]),
  );
  const pageCount = Math.max(...dayPageCounts);
  const pageIndex = page % pageCount;

  return {
    times: days.flatMap((day, index) =>
      day.filter(
        (_, position) => position % dayPageCounts[index] === pageIndex,
      ),
    ),
    pageIndex,
    pageCount,
  };
};
