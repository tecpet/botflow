/**
 * Grade do modo de exibição do seletor de horários (TP-4816).
 *
 * A API devolve um slot a cada `timeCycle` do segmento (5 min na maioria das
 * lojas) e o modo de exibição da loja (de 30 em 30, de hora em hora) é aplicado
 * aqui. Até a TP-4816 isso era guloso: o primeiro horário que sobrava virava a
 * âncora e a lista seguia de N em N a partir dele. A grade então dependia do que
 * vinha antes — o corte da antecedência mínima ("agora + 24h" às 15:04 → 15:05),
 * um 09:00 ocupado (→ 09:05) ou um ocupado no meio do dia (14:00 → 14:05, 14:35)
 * deslocavam todos os horários seguintes, e o bot ofertava 09:05, 09:35, 10:05
 * para uma clínica que abre às 09:00 e trabalha em blocos de 30 min.
 *
 * Agora cada horário é avaliado sozinho: entra quando cai na grade contada a
 * partir da abertura do segmento no dia. Corte de antecedência e horário
 * ocupado só removem pontos da grade, nunca a deslocam.
 */
import {
  ChatbotTimeDisplayModeEnum,
  type PaShopConfigurationsSegment,
  type PaShopConfigurationsTimeTable,
} from "@tec.pet/tecpet-sdk";
import { timeToMinutes } from "./groupReschedule";

type DayKey = keyof Omit<PaShopConfigurationsTimeTable, "fullTime">;

// Mesma ordem do `Date#getUTCDay` (0 = domingo).
const DAY_KEYS: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Passo da grade em minutos; `0` = sem afinar (modo ALL, vazio ou desconhecido). */
export const intervalMinutesByDisplayMode = (mode: unknown): number => {
  if (mode === ChatbotTimeDisplayModeEnum.THIRTY_MIN) return 30;
  if (mode === ChatbotTimeDisplayModeEnum.ONE_HOUR) return 60;
  return 0;
};

export type DisplayGridOrigin = {
  /** Minutos desde a meia-noite a partir dos quais a grade é contada. */
  minutes: number;
  source: "timeTable" | "midnight";
};

const MIDNIGHT_ORIGIN: DisplayGridOrigin = { minutes: 0, source: "midnight" };

/**
 * Abertura do segmento no dia (`dateISO`, "yyyy-MM-dd"), lida do
 * `/shop/configurations` que o fluxo guarda em `Loja.Configuracoes` — o mesmo
 * horário de funcionamento (já com os dias de operação) que a API usa para
 * montar os slots.
 *
 * Com mais de um turno no dia (ex.: pausa para almoço), a grade continua
 * contada da PRIMEIRA abertura, que é como a agenda da loja é desenhada.
 *
 * Sem horário cadastrado para o segmento, 24h ou configuração ilegível, a grade
 * cai para a meia-noite (:00/:30, hora cheia) — o certo para quase toda loja, e
 * nunca pior do que deslocar a grade pelo primeiro horário livre.
 */
export const resolveDisplayGridOrigin = ({
  shopSettings,
  segmentType,
  dateISO,
}: {
  shopSettings: { segments?: PaShopConfigurationsSegment[] } | undefined;
  segmentType: unknown;
  dateISO: string;
}): DisplayGridOrigin => {
  const segments = shopSettings?.segments;

  if (!Array.isArray(segments)) return MIDNIGHT_ORIGIN;

  const timeTable = segments.find(
    (segment) => segment?.type === segmentType,
  )?.timeTable;

  if (!timeTable || timeTable.fullTime) return MIDNIGHT_ORIGIN;

  const weekDay = new Date(`${dateISO}T12:00:00Z`).getUTCDay();

  if (Number.isNaN(weekDay)) return MIDNIGHT_ORIGIN;

  const ranges = timeTable[DAY_KEYS[weekDay]];

  if (!Array.isArray(ranges)) return MIDNIGHT_ORIGIN;

  const openings = ranges
    .map((range) => timeToMinutes(range?.start))
    .filter((minutes): minutes is number => minutes !== null);

  if (openings.length === 0) return MIDNIGHT_ORIGIN;

  return { minutes: Math.min(...openings), source: "timeTable" };
};

/**
 * Mantém só os horários que caem na grade. Sem estado: um horário ausente
 * (ocupado ou cortado pela antecedência) não desloca os demais.
 *
 * Horário com formato inesperado é mantido — a API é a fonte da verdade sobre o
 * slot existir (mesmo critério do corte de antecedência mínima).
 */
export const filterByDisplayGrid = <T extends { start: string }>(
  times: T[],
  intervalMinutes: number,
  origin: DisplayGridOrigin,
): T[] => {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return times;

  return times.filter((time) => {
    const minutes = timeToMinutes(time.start);

    if (minutes === null) return true;

    return (minutes - origin.minutes) % intervalMinutes === 0;
  });
};
