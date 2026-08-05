import type { PaGetAvailableTimesResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import {
  DEFAULT_SHOP_TIMEZONE,
  isBookingWithinMinAdvanceHours,
} from "../../helpers/bookingMinAdvance";
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

    let shopSettings: { timeZone?: string } | undefined;
    try {
      shopSettings = rawShopSettings ? JSON.parse(rawShopSettings) : undefined;
    } catch (parseError) {
      console.error(
        `${LOG_TAG} falha ao fazer parse de shopSettings`,
        { rawShopSettings },
        parseError,
      );
    }

    // O parser envia "" quando a loja habilitou o leva e traz sem definir
    // antecedência (`allowTakeAndBring.minAdvanceHours` ausente) — nesse caso
    // não há restrição, então 0. Um valor presente mas não numérico é erro de
    // configuração: cai no guard de `Number.isFinite` abaixo em vez de virar
    // NaN e bloquear todos os horários sem explicação.
    const rawMinAdvanceHours = String(
      options.takeAndBringMinAdvanceHours ?? "",
    ).trim();
    const minAdvanceHours =
      rawMinAdvanceHours === "" ? 0 : Number(rawMinAdvanceHours);
    // O config da loja expõe o campo como `timeZone` (Z maiúsculo); ler
    // `timezone` retornava sempre undefined e — com o guard abaixo — forçava
    // takeAndBringAllowed=false, pulando a oferta. Default defensivo para a
    // timezone padrão das lojas caso o campo venha ausente.
    const shopTimezone = shopSettings?.timeZone ?? DEFAULT_SHOP_TIMEZONE;

    logHandler("validateTakeAndBringMinAdvanceHours", {
      dateISO: selectedTime?.dateISO ?? null,
      slotStart: selectedTime?.start ?? null,
      minAdvanceHours,
      shopTimezone: shopTimezone ?? null,
    });

    // Guarda explícita: antes, qualquer um desses ausentes lançava exceção,
    // caía no catch silencioso e deixava a variável indefinida (a oferta sumia
    // sem rastro). Agora logamos exatamente o que faltou e definimos o fallback.
    // `start` entra no guard porque a opção "PREFIRO OUTRA DATA" vem com
    // dateISO e start vazios, e sem horário não há antecedência a avaliar.
    if (
      !selectedTime ||
      !selectedTime.dateISO ||
      !selectedTime.start ||
      !Number.isFinite(minAdvanceHours)
    ) {
      console.warn(
        `${LOG_TAG} inputs insuficientes para avaliar a antecedência — usando fallback ${FALLBACK_ON_ERROR}`,
        {
          hasSelectedTime: Boolean(selectedTime),
          dateISO: selectedTime?.dateISO ?? null,
          slotStart: selectedTime?.start ?? null,
          rawMinAdvanceHours,
          minAdvanceHours,
          shopTimezone: shopTimezone ?? null,
        },
      );
      logHandler("validateTakeAndBringMinAdvanceHours", {
        takeAndBringAllowed: FALLBACK_ON_ERROR,
        reason: !Number.isFinite(minAdvanceHours)
          ? "antecedência mínima não numérica — usando fallback"
          : "inputs insuficientes (selectedTime/dateISO/start ausente) — usando fallback",
        hasSelectedTime: Boolean(selectedTime),
        dateISO: selectedTime?.dateISO ?? null,
        slotStart: selectedTime?.start ?? null,
        rawMinAdvanceHours,
        shopTimezone: shopTimezone ?? null,
      });
      setAllowed(FALLBACK_ON_ERROR);
      return;
    }

    const evaluated = isTimeAllowedByMinAdvance(
      selectedTime,
      minAdvanceHours,
      selectedTime.dateISO,
      shopTimezone,
    );

    if (evaluated === null) {
      console.warn(
        `${LOG_TAG} não foi possível calcular o início do horário — usando fallback ${FALLBACK_ON_ERROR}`,
        {
          dateISO: selectedTime.dateISO,
          slotStart: selectedTime.start,
          minAdvanceHours,
          shopTimezone,
        },
      );
      logHandler("validateTakeAndBringMinAdvanceHours", {
        takeAndBringAllowed: FALLBACK_ON_ERROR,
        reason:
          "início do horário inválido (dateISO/start não parseáveis) — usando fallback",
        dateISO: selectedTime.dateISO,
        slotStart: selectedTime.start,
        minAdvanceHours,
        shopTimezone,
      });
      setAllowed(FALLBACK_ON_ERROR);
      return;
    }

    const takeAndBringAllowed = evaluated;

    console.log(`${LOG_TAG} resultado`, {
      dateISO: selectedTime.dateISO,
      slotStart: selectedTime.start,
      minAdvanceHours,
      shopTimezone,
      takeAndBringAllowed,
    });

    logHandler("validateTakeAndBringMinAdvanceHours", {
      takeAndBringAllowed,
      reason: takeAndBringAllowed
        ? "horário respeita a antecedência mínima — leva e traz permitido"
        : "horário não respeita a antecedência mínima — leva e traz bloqueado",
      dateISO: selectedTime.dateISO,
      slotStart: selectedTime.start,
      minAdvanceHours,
      shopTimezone,
    });

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

/**
 * `true`  = o horário respeita a antecedência mínima (oferta o leva e traz).
 * `false` = faltam MENOS de `minAdvanceHours` horas para o início (bloqueia).
 * `null`  = não foi possível avaliar (data/horário inválidos) — o chamador
 *           decide o fallback.
 *
 * `minAdvanceHours` <= 0 (ou inválido) significa "sem restrição" → sempre `true`.
 *
 * Compara instantes completos (data + hora) via `isBookingWithinMinAdvanceHours`.
 * Antes isso era feito em "minutos desde a meia-noite", avaliando o corte apenas
 * quando `dateContext` era HOJE e liberando qualquer data futura — o que fazia
 * antecedências maiores que o resto do dia (24h, 48h) nunca bloquearem nada:
 * todo horário de amanhã em diante passava direto.
 */
export function isTimeAllowedByMinAdvance(
  time: PaGetAvailableTimesResponse & AvailableTimeType,
  minAdvanceHours: number,
  dateContext: string,
  shopTimezone: string,
): boolean | null {
  if (!time?.start) {
    console.warn(`${LOG_TAG} horário sem start — não é possível avaliar`);
    return null;
  }

  const allowed = isBookingWithinMinAdvanceHours({
    date: dateContext,
    start: time.start,
    minAdvanceHours,
    shopTimezone,
  });

  console.log(`${LOG_TAG} avaliando corte de antecedência`, {
    dateContext,
    slotStart: time.start,
    minAdvanceHours,
    shopTimezone,
    allowed,
  });

  return allowed;
}
