import type { PaGetAvailableTimesResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { getHours, getMinutes } from "date-fns";
import { format, utcToZonedTime } from "date-fns-tz";
import { baseOptions } from "../../constants";
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
export const ValidateTakeAndBringMinAdvanceHoursHandler = async ({
  options,
  variables,
  logs,
}: {
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
  try {
    const rawSelectedTime = options.selectedTime as string;

    const selectedTime: PaGetAvailableTimesResponse & AvailableTimeType =
      JSON.parse(rawSelectedTime);

    const minAdvanceHours = Number(options.takeAndBringMinAdvanceHours ?? 0);

    const shopSettings = options.shopSettings
      ? JSON.parse(options.shopSettings as string)
      : undefined;

    const takeAndBringAllowed = isTimeAllowedByMinAdvance(
      selectedTime,
      minAdvanceHours,
      selectedTime.dateISO,
      shopSettings.timezone,
    );

    variables.set([
      {
        id: options.takeAndBringMinAdvanceAllowed as string,
        value: takeAndBringAllowed,
      },
    ]);
  } catch (error) {
    console.error(error);
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
  if (!time) return false;
  if (minAdvanceHours <= 0) return true;

  const nowInShopTimezone = utcToZonedTime(new Date(), shopTimezone);

  const nowMinutes =
    getHours(nowInShopTimezone) * 60 + getMinutes(nowInShopTimezone);

  const cutOffMinutes = nowMinutes + minAdvanceHours * 60;

  const todayDateStr = format(nowInShopTimezone, "yyyy-MM-dd");

  const isToday = dateContext === todayDateStr;

  if (!isToday) return true;

  const slotMinutes = getMinutesFromMidnight(time.start);

  return slotMinutes >= cutOffMinutes;
}
