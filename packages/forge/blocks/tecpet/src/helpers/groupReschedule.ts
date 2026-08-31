/**
 * Núcleo do reagendamento em grupo (TP-4108).
 *
 * A notificação de confirmação agrupada cita todos os pets do tutor no dia, mas
 * até a TP-4098 o botão "Reagendar" carregava um único `bookingId` — o líder. O
 * gateway agora manda a lista inteira (`Agendamento.Ids`, ordenada por horário),
 * e cabe ao fluxo mover TODOS os pets.
 *
 * A armadilha está aqui: a consulta de horários da API é POR PET e não conhece
 * as reservas que ainda vamos fazer para os irmãos. N chamadas independentes
 * devolvem o MESMO horário livre e os N pets acabam empilhados no mesmo slot —
 * foi exatamente o que aconteceu na IA (TP-2956: três banhos às 08:00). Por isso
 * a combinação é montada aqui, em memória: um pet por vez, em sequência, e a
 * combinação é descartada inteira quando não fecha.
 *
 * Tudo neste arquivo é função pura, sem I/O — os handlers cuidam da API.
 */

/** Slot de horário vindo do `availableTimes`, no mínimo que a combinação usa. */
export type GroupSlot = {
  id: string;
  start: string;
  stop: string;
};

/** Agendamento do grupo, no mínimo que a combinação usa. */
export type GroupBookingRef = {
  id: number;
  petId: number;
  petName: string;
};

export type GroupScheduleItem = {
  bookingId: number;
  petId: number;
  petName: string;
  timeId: string;
  dateISO: string;
  dateBR: string;
  start: string;
  stop: string;
};

/**
 * Uma opção oferecida ao tutor. O formato estende o de um horário comum
 * (`id`/`start`/`stop`/`dateISO`/`dateBR`/`scheduleStartTime`) de propósito:
 * assim o "Construir opções de horarios diposniveis" e o "Verificar opção de
 * horario selecionada" que já existem funcionam sem alteração, e o `items` viaja
 * junto para o bloco que reagenda.
 */
export type GroupTimeOption = {
  id: string;
  start: string;
  stop: string;
  dateISO: string;
  dateBR: string;
  scheduleStartTime: string;
  items: GroupScheduleItem[];
  petNames: string[];
  scheduleSummary: string[];
};

export type GroupPetAvailability = {
  booking: GroupBookingRef;
  times: GroupSlot[];
};

/**
 * Lê `Agendamento.Ids`. O gateway manda "7445316,7447749,7447797", mas a mesma
 * variável pode chegar como array (quando o fluxo a preenche a partir de uma
 * lista) ou como número único no caso de um pet só.
 *
 * Diferente do `parseIds`, este parser NUNCA lança: id malformado é entrada
 * ruim, e derrubar o handler deixa as variáveis de saída com o valor anterior —
 * o caminho que fez o fluxo reentrar no mesmo bloco na TP-3635. Preserva a ordem
 * recebida (por horário, com desempate pelo id) e remove duplicados.
 */
export const parseBookingIdList = (raw: unknown): number[] => {
  const collect = (value: unknown): unknown[] => {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "number") return [value];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return [];

      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Não é JSON: segue como texto separado por vírgula.
        }
      }

      return trimmed.split(/[,;\s]+/);
    }
    if (typeof value === "object") return [value];

    return [];
  };

  const ids: number[] = [];

  for (const item of collect(raw)) {
    const candidate =
      typeof item === "object" && item !== null
        ? (item as { id?: unknown }).id
        : item;

    const id = Number(candidate);

    if (Number.isInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
  }

  return ids;
};

/** "HH:mm" para minutos desde a meia-noite. `null` quando o formato não serve. */
export const timeToMinutes = (time: unknown): number | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time ?? "").trim());

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
};

/** "JUDDY, JIMMY e BIANCA" — como a própria notificação agrupada escreve. */
export const formatPtBrList = (items: string[]): string => {
  const values = items.filter(Boolean);

  if (values.length === 0) return "";
  if (values.length === 1) return values[0];

  return `${values.slice(0, -1).join(", ")} e ${values[values.length - 1]}`;
};

const isUsableSlot = (slot: GroupSlot): boolean =>
  Boolean(slot?.id) &&
  timeToMinutes(slot?.start) !== null &&
  timeToMinutes(slot?.stop) !== null;

/**
 * Monta as combinações de um único dia.
 *
 * Para cada horário candidato do primeiro pet (a âncora do bloco), encaixa os
 * demais em sequência: cada pet recebe o horário viável que TERMINA mais cedo —
 * é a escolha que deixa mais espaço para o próximo, e por isso a que faz o bloco
 * fechar sempre que existir alguma sequência possível a partir daquela âncora. A
 * âncora vira uma opção só quando TODOS os pets couberam; combinação pela metade
 * não é oferecida ao tutor.
 *
 * A ordem dos pets é a que veio do gateway (por horário), então o bloco novo
 * mantém a mesma sequência do bloco antigo. "Sem sobreposição" é deliberado: a
 * loja pode até atender dois pets em paralelo, mas nada no `availableTimes` nos
 * diz isso — empilhar sem essa garantia é o overbooking do TP-2956.
 */
export const buildGroupCombinationsForDate = ({
  availabilities,
  dateISO,
  dateBR,
  maxCombinations = 20,
}: {
  availabilities: GroupPetAvailability[];
  dateISO: string;
  dateBR: string;
  maxCombinations?: number;
}): GroupTimeOption[] => {
  if (availabilities.length === 0) return [];

  const usable = availabilities.map((availability) => ({
    booking: availability.booking,
    times: (availability.times ?? [])
      .filter(isUsableSlot)
      .slice()
      .sort(
        (a, b) =>
          (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0) ||
          (timeToMinutes(a.stop) ?? 0) - (timeToMinutes(b.stop) ?? 0),
      ),
  }));

  // Um pet sem horário nenhum já elimina o dia inteiro — não há combinação
  // completa possível.
  if (usable.some((availability) => availability.times.length === 0)) return [];

  const toItem = (
    booking: GroupBookingRef,
    slot: GroupSlot,
  ): GroupScheduleItem => ({
    bookingId: booking.id,
    petId: booking.petId,
    petName: booking.petName,
    timeId: slot.id,
    dateISO,
    dateBR,
    start: slot.start,
    stop: slot.stop,
  });

  const options: GroupTimeOption[] = [];

  for (const anchor of usable[0].times) {
    if (options.length >= maxCombinations) break;

    const items: GroupScheduleItem[] = [toItem(usable[0].booking, anchor)];

    let cursor = timeToMinutes(anchor.stop) as number;
    let fits = true;

    for (let index = 1; index < usable.length; index++) {
      const { booking, times } = usable[index];

      let chosen: GroupSlot | null = null;
      let chosenStop = Number.POSITIVE_INFINITY;

      for (const slot of times) {
        const start = timeToMinutes(slot.start) as number;
        const stop = timeToMinutes(slot.stop) as number;

        if (start < cursor) continue;

        if (stop < chosenStop) {
          chosen = slot;
          chosenStop = stop;
        }
      }

      if (!chosen) {
        fits = false;
        break;
      }

      items.push(toItem(booking, chosen));
      cursor = chosenStop;
    }

    if (!fits) continue;

    options.push({
      id: `GROUP_${dateISO}_${items[0].start.replace(":", "")}`,
      start: items[0].start,
      stop: items[items.length - 1].stop,
      dateISO,
      dateBR,
      scheduleStartTime: items[0].start,
      items,
      petNames: items.map((item) => item.petName),
      scheduleSummary: items.map((item) => `${item.petName} às ${item.start}`),
    });
  }

  return options;
};

/**
 * Afina a lista de opções pelo modo de exibição da loja (de 30 em 30 min, de
 * hora em hora), olhando o início do BLOCO. Mesma regra do seletor de um pet só,
 * aplicada uma vez sobre a combinação em vez de por pet — afinar antes de
 * combinar descartaria encaixes válidos.
 */
export const thinGroupOptionsByInterval = (
  options: GroupTimeOption[],
  intervalMinutes: number,
): GroupTimeOption[] => {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return options;
  if (options.length === 0) return options;

  const sorted = options
    .slice()
    .sort(
      (a, b) => (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0),
    );

  const kept: GroupTimeOption[] = [sorted[0]];
  let lastMinutes = timeToMinutes(sorted[0].start) as number;

  for (let index = 1; index < sorted.length; index++) {
    const minutes = timeToMinutes(sorted[index].start) as number;

    if (minutes - lastMinutes >= intervalMinutes) {
      kept.push(sorted[index]);
      lastMinutes = minutes;
    }
  }

  return kept;
};
