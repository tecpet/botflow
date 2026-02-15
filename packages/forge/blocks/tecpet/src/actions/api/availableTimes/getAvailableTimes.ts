import {
  ChatbotTimeDisplayModeEnum,
  type PaEmployeeIndication,
  type PaGetAvailableTimesResponse,
  type PaGetAvailableTimesTimesBody,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { format, getHours, getMinutes } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { formatBRDate, formatISODate, parseIds } from "../../../helpers/utils";
import type { ServiceOptionType } from "../../internal/buildServiceOptions";

export type AvailableTimeType = PaGetAvailableTimesResponse & {
  dateISO: string; // 2025-06-11
  dateBR: string; // 11/06/2025
  scheduleStartTime: string; // 08:00
};

export const getAvailableTimes = createAction({
  auth,
  baseOptions,
  name: "Buscar opções de horário",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    bookingId: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: false,
      helperText: "Agendamento",
    }),
    combosIds: option.string.layout({
      label: "Id dos combos disponiveis",
      isRequired: true,
      helperText: "Id dos combos disponiveis",
    }),
    servicesIds: option.string.layout({
      label: "Id dos serviços disponiveis",
      isRequired: true,
      helperText: "Id dos serviços disponiveis",
    }),
    employeeIndications: option.string.layout({
      label: "Funcionários indicados para o serviço",
      isRequired: true,
    }),
    petId: option.number.layout({
      label: "Id do Pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    selectedService: option.string.layout({
      label: "Serviço selecionado",
      helperText: "Serviço selecionado",
    }),
    showOtherDates: option.string.layout({
      label: "Escolher outras datas disponiveis",
      isRequired: true,
      helperText: "Selecionado outras datas",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Seletor de horários - Modo exibição dos horarios",
      placeholder: "Selecione",
      helperText: "Modo de exibição dos horários no seletor de horários",
    }),
    getAdditionalDays: option.string.layout({
      label: "Quantidade de dias adicionais",
      isRequired: true,
      defaultValue: "0",
      helperText: "Buscar quantidade de dias atuais",
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: true,
      helperText: "Configurações da loja",
    }),
    selectedTimeMinAdvanceHours: option.string.layout({
      label: "Tempo mínimo de antecedência para o horário selecionado",
      isRequired: true,
      helperText: "Tempo mínimo de antecedência para o horário selecionado",
    }),
    inputAdditionalDays: option.string.layout({
      label: "Input de dias adicionais",
      helperText: "Dias para adicionar",
      inputType: "variableDropdown",
    }),
    availableTimes: option.string.layout({
      label: "Array de horarios disponiveis",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    noTimesAvailable: option.string.layout({
      label: "Input de dias adicionais",
      helperText: "Dias para adicionar",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    availableTimes,
    inputAdditionalDays,
    noTimesAvailable,
  }) => {
    const variables = [];

    if (availableTimes) variables.push(availableTimes);

    if (inputAdditionalDays) variables.push(inputAdditionalDays);

    if (noTimesAvailable) variables.push(noTimesAvailable);

    return variables;
  },
});
export const GetAvailableTimesHandler = async ({
  credentials,
  options,
  variables,
  logs,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
  try {
    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const rawEmployeeIndications = options.employeeIndications;

    const parsedEmployeeIndications: string[] = rawEmployeeIndications
      ? JSON.parse(options.employeeIndications as string)
      : [];

    const employeesIndication: PaEmployeeIndication[] =
      parsedEmployeeIndications.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );

    const rawAdditionalDays = options.getAdditionalDays;

    const timeSelectionBehaviorTimeDisplayMode: ChatbotTimeDisplayModeEnum =
      (options.timeSelectionBehaviorTimeDisplayMode as ChatbotTimeDisplayModeEnum) ??
      null;

    const shopSettings = options.shopSettings
      ? JSON.parse(options.shopSettings as string)
      : undefined;

    const selectedTimeMinAdvanceHours = Number(
      options.selectedTimeMinAdvanceHours ?? 0,
    );

    const rawServices = options.servicesIds
      ? JSON.parse(options.servicesIds as string)
      : [];
    const rawCombos = options.combosIds
      ? JSON.parse(options.combosIds as string)
      : [];

    const bookingId = options.bookingId
      ? JSON.parse(options.bookingId as string)
      : null;

    let services: number[] = [];
    let combos: number[] = [];

    if (bookingId) {
      services = parseIds(rawServices);
      combos = parseIds(rawCombos);
    } else {
      const parsedSelectedService: ServiceOptionType = JSON.parse(
        options.selectedService as string,
      );

      const serviceIds = parseIds(rawServices);
      const comboIds = parseIds(rawCombos);

      const selectedId = Number(parsedSelectedService.id);

      services = serviceIds.includes(selectedId) ? [selectedId] : [];
      combos = comboIds.includes(selectedId) ? [selectedId] : [];
    }

    let additionalDays = rawAdditionalDays ? Number(rawAdditionalDays) : 0;

    const showOtherDates = JSON.parse(
      (options.showOtherDates as string) ?? "false",
    );

    if (showOtherDates) {
      additionalDays += 2;
    }

    const MAX_ATTEMPTS = 10; // As tentativas máximas vao ser o total dividido pelos dias adicionais no caso são 5 que seria 10/2;

    const today = new Date();

    if (showOtherDates) today.setDate(today.getDate() + additionalDays);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const searchDates = [formatISODate(today), formatISODate(tomorrow)];

    const all: AvailableTimeType[] = [];

    for (const dateISO of searchDates) {
      const body: PaGetAvailableTimesTimesBody = {
        date: dateISO,
        combos,
        services,
        petId: Number(options.petId),
        segment: options.segmentType as ShopSegment,
        employeesIndication,
      };

      let times: PaGetAvailableTimesResponse[] = [];

      try {
        times = await tecpetSdk.availableTimes.list(
          body,
          Number(options.shopId),
        );
        let filteredAvailableTimes = times;

        filteredAvailableTimes = filterAvailableTimesByMinAdvance(
          filteredAvailableTimes,
          selectedTimeMinAdvanceHours,
          dateISO,
          shopSettings.timezone,
        );

        filteredAvailableTimes = filterAvailableTimesByInterval(
          filteredAvailableTimes,
          timeSelectionBehaviorTimeDisplayMode,
        );

        filteredAvailableTimes?.forEach((t: PaGetAvailableTimesResponse) =>
          all.push({
            ...t,
            dateISO,
            dateBR: formatBRDate(dateISO),
            scheduleStartTime: `${t.start}`,
          }),
        );
      } catch (error) {
        console.log(error);
      }
    }

    if (all.length > 0) {
      all.sort((a, b) =>
        a.dateISO === b.dateISO
          ? a.start.localeCompare(b.start)
          : a.dateISO.localeCompare(b.dateISO),
      );
    }

    if (additionalDays > MAX_ATTEMPTS) {
      variables.set([{ id: options.noTimesAvailable as string, value: true }]);
    }

    variables.set([
      { id: options.inputAdditionalDays as string, value: additionalDays },
    ]);
    variables.set([{ id: options.availableTimes as string, value: all ?? [] }]);
  } catch (error) {
    console.error(error);
  }
};

function getMinutesFromMidnight(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function filterAvailableTimesByMinAdvance(
  times: PaGetAvailableTimesResponse[],
  minAdvanceHours: number,
  dateContext: string,
  shopTimezone: string,
): PaGetAvailableTimesResponse[] {
  if (minAdvanceHours <= 0 || times.length === 0) {
    return times;
  }
  const nowInShopTimezone = utcToZonedTime(new Date(), shopTimezone);
  const nowMinutes =
    getHours(nowInShopTimezone) * 60 + getMinutes(nowInShopTimezone);
  const cutOffMinutes = nowMinutes + minAdvanceHours * 60;
  const todayDateStr = format(nowInShopTimezone, "yyyy-MM-dd");
  const isToday = dateContext === todayDateStr;
  if (!isToday) {
    return times;
  }
  return times.filter((time) => {
    const slotMinutes = getMinutesFromMidnight(time.start);
    return slotMinutes >= cutOffMinutes;
  });
}

function filterAvailableTimesByInterval(
  times: PaGetAvailableTimesResponse[],
  mode: ChatbotTimeDisplayModeEnum | null,
): PaGetAvailableTimesResponse[] {
  if (!mode || mode === ChatbotTimeDisplayModeEnum.ALL || times.length === 0) {
    return times;
  }
  const timesWithMinutes = times.map((t) => ({
    ...t,
    minutes: getMinutesFromMidnight(t.start),
  }));
  timesWithMinutes.sort((a, b) => a.minutes - b.minutes);

  const intervalMinutes =
    mode === ChatbotTimeDisplayModeEnum.THIRTY_MIN ? 30 : 60;

  const filtered = [timesWithMinutes[0]];
  let lastMinutes = timesWithMinutes[0].minutes;

  for (let i = 1; i < timesWithMinutes.length; i++) {
    const currentMinutes = timesWithMinutes[i].minutes;
    if (currentMinutes - lastMinutes >= intervalMinutes) {
      filtered.push(timesWithMinutes[i]);
      lastMinutes = currentMinutes;
    }
  }
  return filtered.map(({ minutes, ...rest }) => rest);
}
