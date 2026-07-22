import { utcToZonedTime } from "date-fns-tz";
import { logHandler } from "./logger";

// Fuso padrão das lojas quando `shopSettings.timeZone` vem ausente. O config
// expõe o campo como `timeZone` (Z maiúsculo) — ler `timezone` retorna undefined.
const DEFAULT_SHOP_TIMEZONE = "America/Sao_Paulo";

// Antecedência mínima padrão (horas) quando a loja NÃO fornece um valor
// (campo ausente/vazio/inválido). Um `0` EXPLÍCITO continua significando
// "sem restrição" (a `isBookingWithinMinAdvanceHours` libera quando <= 0).
export const DEFAULT_MIN_ADVANCE_HOURS = 1;

/**
 * Resolve o valor de antecedência mínima a partir da option (string/número):
 * ausente, vazio, em branco ou inválido → `fallback` (default 1h). Um número
 * válido (inclusive `0`, que desativa a restrição) é preservado.
 */
export function resolveMinAdvanceHours(
  raw: unknown,
  fallback: number = DEFAULT_MIN_ADVANCE_HOURS,
): number {
  if (raw === undefined || raw === null) return fallback;

  const trimmed = String(raw).trim();
  if (trimmed === "") return fallback;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Constrói o horário de INÍCIO do agendamento como um `Date` interpretado no
 * fuso do container (UTC em produção) a partir dos campos de horário de parede
 * da loja (`date` + `start`). Isso é intencional: o "agora" para comparação é
 * `utcToZonedTime(new Date(), tz)`, cujos campos locais também representam o
 * horário de parede da loja — assim os dois lados ficam na mesma referência.
 *
 * Aceita `date` em "dd/MM/yyyy" ou "dd/MM". Sem o ano, infere: usa o ano atual
 * e, se o instante resultante já estiver no passado, avança um ano (cobre a
 * virada dez→jan, já que a lista só traz agendamentos futuros).
 */
export function parseBookingStartWallClock(
  date: string,
  start: string,
  nowInShopTz: Date,
): Date | null {
  if (!date || !start) return null;

  const [day, month, maybeYear] = date.split("/").map(Number);
  const [hour, minute] = start.split(":").map(Number);

  if ([day, month, hour, minute].some((n) => !Number.isFinite(n))) return null;

  const hasYear = Number.isFinite(maybeYear);
  const year = hasYear ? maybeYear : nowInShopTz.getFullYear();

  let bookingStart = new Date(year, month - 1, day, hour, minute);

  if (!hasYear && bookingStart.getTime() < nowInShopTz.getTime()) {
    bookingStart = new Date(year + 1, month - 1, day, hour, minute);
  }

  return bookingStart;
}

/**
 * `true`  = o agendamento ainda respeita a antecedência mínima (ação permitida).
 * `false` = faltam MENOS de `minAdvanceHours` horas para o início (bloquear).
 * `null`  = não foi possível avaliar (data/horário ausentes ou inválidos) — o
 *           chamador decide o fallback.
 *
 * `minAdvanceHours` <= 0 (ou inválido) significa "sem restrição" → sempre `true`.
 *
 * Correto na virada de meia-noite: compara instantes completos (data+hora), não
 * "minutos desde a meia-noite" — então uma janela como agora=22:00 vs início às
 * 03:00 do dia seguinte é avaliada como ~5h restantes (e bloqueia se X=6h).
 */
export function isBookingWithinMinAdvanceHours(params: {
  date: string;
  start: string;
  minAdvanceHours: number;
  shopTimezone?: string;
  now?: Date;
}): boolean | null {
  const { date, start, minAdvanceHours } = params;

  if (!Number.isFinite(minAdvanceHours) || minAdvanceHours <= 0) return true;

  const shopTimezone = params.shopTimezone ?? DEFAULT_SHOP_TIMEZONE;
  const nowInShopTz = params.now ?? utcToZonedTime(new Date(), shopTimezone);

  const bookingStart = parseBookingStartWallClock(date, start, nowInShopTz);
  if (!bookingStart) return null;

  const hoursUntilStart =
    (bookingStart.getTime() - nowInShopTz.getTime()) / (60 * 60 * 1000);

  return hoursUntilStart >= minAdvanceHours;
}

/**
 * Fábrica de handler para as validações de antecedência mínima de alteração de
 * agendamento (cancelamento / reagendamento). Ambas seguem exatamente a mesma
 * lógica — só mudam o rótulo, a option com as horas e a variável de saída.
 *
 * Grava um booleano na variável alvo: `true` quando a ação é permitida (respeita
 * a antecedência), `false` quando deve ser bloqueada. A variável NUNCA fica
 * indefinida — indefinido faz o fluxo pular a checagem silenciosamente; por isso
 * usamos `fallbackOnError` (default `false` = conservador: bloqueia quando não
 * dá para confirmar).
 */
export function createBookingMinAdvanceHandler(config: {
  handlerName: string;
  minAdvanceHoursOptionKey: string;
  targetOptionKey: string;
  fallbackOnError?: boolean;
}) {
  const { handlerName, minAdvanceHoursOptionKey, targetOptionKey } = config;
  const fallbackOnError = config.fallbackOnError ?? false;
  const logTag = `[${handlerName}]`;

  return async ({
    options,
    variables,
  }: {
    options: Record<string, unknown>;
    variables: any;
  }) => {
    const targetVariableId = options[targetOptionKey] as string;

    const setAllowed = (value: boolean) => {
      if (targetVariableId) {
        variables.set([{ id: targetVariableId, value }]);
      }
    };

    try {
      let booking: { date?: string; start?: string } | null = null;
      try {
        booking = options.booking
          ? JSON.parse(options.booking as string)
          : null;
      } catch (parseError) {
        console.error(
          `${logTag} falha ao fazer parse do agendamento`,
          { rawBooking: options.booking },
          parseError,
        );
      }

      let shopSettings: { timeZone?: string } | undefined;
      try {
        shopSettings = options.shopSettings
          ? JSON.parse(options.shopSettings as string)
          : undefined;
      } catch (parseError) {
        console.error(
          `${logTag} falha ao fazer parse de shopSettings`,
          { rawShopSettings: options.shopSettings },
          parseError,
        );
      }

      const minAdvanceHours = resolveMinAdvanceHours(
        options[minAdvanceHoursOptionKey],
      );
      const shopTimezone = shopSettings?.timeZone ?? DEFAULT_SHOP_TIMEZONE;

      logHandler(handlerName, {
        bookingDate: booking?.date ?? null,
        bookingStart: booking?.start ?? null,
        minAdvanceHours,
        shopTimezone,
      });

      if (!booking?.date || !booking?.start) {
        console.warn(
          `${logTag} inputs insuficientes para avaliar a antecedência — usando fallback ${fallbackOnError}`,
          {
            hasBooking: Boolean(booking),
            bookingDate: booking?.date ?? null,
            bookingStart: booking?.start ?? null,
            minAdvanceHours,
            shopTimezone,
          },
        );
        setAllowed(fallbackOnError);
        return;
      }

      const allowed = isBookingWithinMinAdvanceHours({
        date: booking.date,
        start: booking.start,
        minAdvanceHours,
        shopTimezone,
      });

      if (allowed === null) {
        console.warn(
          `${logTag} não foi possível calcular o início do agendamento — usando fallback ${fallbackOnError}`,
          {
            bookingDate: booking.date,
            bookingStart: booking.start,
            minAdvanceHours,
            shopTimezone,
          },
        );
        setAllowed(fallbackOnError);
        return;
      }

      logHandler(handlerName, {
        allowed,
        reason: allowed
          ? "respeita a antecedência mínima — ação permitida"
          : "menos que a antecedência mínima — ação bloqueada",
        bookingDate: booking.date,
        bookingStart: booking.start,
        minAdvanceHours,
        shopTimezone,
      });

      setAllowed(allowed);
    } catch (error) {
      console.error(
        `${logTag} erro inesperado ao validar antecedência — usando fallback ${fallbackOnError}`,
        {
          booking: options.booking,
          shopSettings: options.shopSettings,
          minAdvanceHours: options[minAdvanceHoursOptionKey],
        },
        error,
      );
      setAllowed(fallbackOnError);
    }
  };
}
