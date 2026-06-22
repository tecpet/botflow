import type { PaGetAvailableTimesResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { getHours, getMinutes } from "date-fns";
import { format, utcToZonedTime } from "date-fns-tz";
import { baseOptions } from "../../constants";
import { logHandler } from "../../helpers/logger";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";

export const validateTakeAndBringMinAdvanceHours = createAction({
  baseOptions,
  name: "Verificar antedecencia mínima para Leva e traz",
  options: option.object({
    selectedTime: option.string.layout({
      label: "Opção de horário selecionada",
      isRequired: true,
      helperText: "Horário selecionado",
    }),
    takeAndBringMinAdvanceHours: option.string.layout({
      label: "Horas de antecedência mínima para leva e traz",
      isRequired: true,
      helperText: "Horas de antecedência mínima para leva e traz",
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: true,
      helperText: "Configurações da loja",
    }),
    takeAndBringMinAdvanceAllowed: option.string.layout({
      label: "Leva e traz permitido",
      isRequired: true,
      helperText: "Leva e traz permitido",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    selectedTime,
    shopSettings,
    takeAndBringMinAdvanceHours,
  }) => {
    const variables = [];

    if (selectedTime) variables.push(selectedTime);
    if (shopSettings) variables.push(shopSettings);
    if (takeAndBringMinAdvanceHours)
      variables.push(takeAndBringMinAdvanceHours);

    return variables;
  },
});
const LOG_TAG = "[validateTakeAndBringMinAdvanceHours]";

// Valor usado quando não é possível avaliar a regra (input ausente/inválido ou
// exceção inesperada). `false` = conservador: não oferta o leva e traz quando
// não conseguimos confirmar a antecedência (evita oferecer/agendar busca que
// não dá tempo de cumprir). Troque para `true` se a regra de negócio preferir
// ofertar por padrão em caso de falha. O importante é que a variável NUNCA
// fique indefinida — indefinido fazia o fluxo pular a oferta silenciosamente.
const FALLBACK_ON_ERROR = false;

export const ValidateTakeAndBringMinAdvanceHoursHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  const targetVariableId = options.takeAndBringMinAdvanceAllowed as string;

  const setAllowed = (value: boolean) => {
    if (targetVariableId) {
      variables.set([{ id: targetVariableId, value }]);
    }
  };

  try {
    const rawSelectedTime = options.selectedTime as string;
    const rawShopSettings = options.shopSettings as string | undefined;

    let selectedTime: (PaGetAvailableTimesResponse & AvailableTimeType) | null =
      null;
    try {
      selectedTime = rawSelectedTime ? JSON.parse(rawSelectedTime) : null;
    } catch (parseError) {
      console.error(
        `${LOG_TAG} falha ao fazer parse de selectedTime`,
        { rawSelectedTime },
        parseError,
      );
    }

    let shopSettings: { timezone?: string } | undefined;
    try {
      shopSettings = rawShopSettings ? JSON.parse(rawShopSettings) : undefined;
    } catch (parseError) {
      console.error(
        `${LOG_TAG} falha ao fazer parse de shopSettings`,
        { rawShopSettings },
        parseError,
      );
    }

    const minAdvanceHours = Number(options.takeAndBringMinAdvanceHours ?? 0);
    const shopTimezone = shopSettings?.timezone;

    logHandler("validateTakeAndBringMinAdvanceHours", { dateISO: selectedTime?.dateISO ?? null, slotStart: selectedTime?.start ?? null, minAdvanceHours, shopTimezone: shopTimezone ?? null });

    // Guarda explícita: antes, qualquer um desses ausentes lançava exceção,
    // caía no catch silencioso e deixava a variável indefinida (a oferta sumia
    // sem rastro). Agora logamos exatamente o que faltou e definimos o fallback.
    if (!selectedTime || !selectedTime.dateISO || !shopTimezone) {
      console.warn(
        `${LOG_TAG} inputs insuficientes para avaliar a antecedência — usando fallback ${FALLBACK_ON_ERROR}`,
        {
          hasSelectedTime: Boolean(selectedTime),
          dateISO: selectedTime?.dateISO ?? null,
          slotStart: selectedTime?.start ?? null,
          minAdvanceHours,
          shopTimezone: shopTimezone ?? null,
        },
      );
      logHandler("validateTakeAndBringMinAdvanceHours", { takeAndBringAllowed: FALLBACK_ON_ERROR, reason: "inputs insuficientes (selectedTime/dateISO/timezone ausente) — usando fallback", hasSelectedTime: Boolean(selectedTime), dateISO: selectedTime?.dateISO ?? null, shopTimezone: shopTimezone ?? null });
      setAllowed(FALLBACK_ON_ERROR);
      return;
    }

    const takeAndBringAllowed = isTimeAllowedByMinAdvance(
      selectedTime,
      minAdvanceHours,
      selectedTime.dateISO,
      shopTimezone,
    );

    console.log(`${LOG_TAG} resultado`, {
      dateISO: selectedTime.dateISO,
      slotStart: selectedTime.start,
      minAdvanceHours,
      shopTimezone,
      takeAndBringAllowed,
    });

    logHandler("validateTakeAndBringMinAdvanceHours", { takeAndBringAllowed, reason: takeAndBringAllowed ? "horário respeita a antecedência mínima — leva e traz permitido" : "horário não respeita a antecedência mínima — leva e traz bloqueado", dateISO: selectedTime.dateISO, slotStart: selectedTime.start, minAdvanceHours, shopTimezone });

    setAllowed(takeAndBringAllowed);
  } catch (error) {
    // Catch explícito: registra contexto completo e garante que a variável
    // fique definida (em vez de indefinida, que fazia a oferta sumir).
    console.error(
      `${LOG_TAG} erro inesperado ao validar antecedência — usando fallback ${FALLBACK_ON_ERROR}`,
      {
        selectedTime: options.selectedTime,
        shopSettings: options.shopSettings,
        takeAndBringMinAdvanceHours: options.takeAndBringMinAdvanceHours,
      },
      error,
    );
    setAllowed(FALLBACK_ON_ERROR);
  }
};

function getMinutesFromMidnight(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

export function isTimeAllowedByMinAdvance(
  time: PaGetAvailableTimesResponse & AvailableTimeType,
  minAdvanceHours: number,
  dateContext: string,
  shopTimezone: string,
): boolean {
  if (!time) {
    console.warn(`${LOG_TAG} time ausente — retornando false`);
    return false;
  }
  if (minAdvanceHours <= 0) return true;

  const nowInShopTimezone = utcToZonedTime(new Date(), shopTimezone);

  const nowMinutes =
    getHours(nowInShopTimezone) * 60 + getMinutes(nowInShopTimezone);

  const cutOffMinutes = nowMinutes + minAdvanceHours * 60;

  const todayDateStr = format(nowInShopTimezone, "yyyy-MM-dd");

  const isToday = dateContext === todayDateStr;

  // Data futura sempre passa; o corte de antecedência só é avaliado no mesmo dia.
  if (!isToday) {
    console.log(`${LOG_TAG} data futura (${dateContext}) — permitido`, {
      todayDateStr,
    });
    return true;
  }

  const slotMinutes = getMinutesFromMidnight(time.start);
  const allowed = slotMinutes >= cutOffMinutes;

  console.log(`${LOG_TAG} mesmo dia — avaliando corte de antecedência`, {
    nowMinutes,
    minAdvanceHours,
    cutOffMinutes,
    slotStart: time.start,
    slotMinutes,
    allowed,
  });

  return allowed;
}
