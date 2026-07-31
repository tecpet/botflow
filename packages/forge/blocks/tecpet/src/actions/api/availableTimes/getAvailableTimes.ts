import {
  ChatbotTimeDisplayModeEnum,
  type PaEmployeeIndication,
  type PaGetAvailableTimesResponse,
  type PaGetAvailableTimesTimesBody,
  type PaGetBookingResponse,
  type ShopSegment,
  Status,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { format, getHours, getMinutes } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import {
  extractBookingId,
  formatBRDate,
  formatISODate,
  isUpcomingBooking,
  parseIds,
  parseJsonArray,
} from "../../../helpers/utils";
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
    selectedAdditionals: option.string.layout({
      label: "Adicionais selecionados",
      isRequired: false,
      helperText: "Array de ids dos adicionais selecionados",
    }),
    additionalOptions: option.string.layout({
      label: "Opções de adicionais",
      isRequired: false,
      helperText: "Array de adicionais disponíveis",
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
    groomAdditionalIds: option.string.layout({
      label: "Ids dos adicionais de banho e tosa (GROOM)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "Ids dos adicionais selecionados da categoria GROOM, para exibir/formatar separado do serviço principal",
    }),
  }),
  getSetVariableIds: ({
    availableTimes,
    inputAdditionalDays,
    noTimesAvailable,
    groomAdditionalIds,
  }) => {
    const variables = [];

    if (availableTimes) variables.push(availableTimes);

    if (inputAdditionalDays) variables.push(inputAdditionalDays);

    if (noTimesAvailable) variables.push(noTimesAvailable);

    if (groomAdditionalIds) variables.push(groomAdditionalIds);

    return variables;
  },
});
export const GetAvailableTimesHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
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

    // Campo correto é `timeZone` (Z maiúsculo); `timezone` vinha undefined.
    const shopTimezone = shopSettings?.timeZone ?? "America/Sao_Paulo";

    const selectedTimeMinAdvanceHours = Number(
      options.selectedTimeMinAdvanceHours ?? 0,
    );

    const rawServices = options.servicesIds
      ? JSON.parse(options.servicesIds as string)
      : [];
    const rawCombos = options.combosIds
      ? JSON.parse(options.combosIds as string)
      : [];

    let rawBookingId: unknown = null;
    try {
      rawBookingId = options.bookingId
        ? JSON.parse(options.bookingId as string)
        : null;
    } catch {
      // Texto livre não-JSON nesse campo não deve abortar a busca de horários.
      rawBookingId = null;
    }

    // Primeiro filtro, barato: descarta valor que nem parece id de agendamento
    // (0, false, "", {}, [] e o sentinela { backToMenu: true } da lista de
    // reservas) e evita o GET abaixo.
    const candidateBookingId = extractBookingId(rawBookingId);

    // Um id válido não basta. A variável do fluxo carrega o agendamento anterior
    // do cliente (o getFormattedMessages a consome para montar mensagem), então
    // um cliente recorrente caía no ramo de remarcação ao iniciar um agendamento
    // NOVO, e a busca de horários ia com o catálogo do pet em vez do serviço
    // escolhido — devolvendo slot com a soma das durações. Só é remarcação
    // quando o id aponta para um agendamento que o fluxo de "minhas reservas"
    // ofereceria: do mesmo pet, em aberto e ainda por vir.
    let rescheduleBooking: PaGetBookingResponse | null = null;

    if (candidateBookingId !== null) {
      try {
        const booking = await tecpetSdk.booking.get(
          candidateBookingId,
          Number(options.shopId),
        );

        const isOpen =
          booking?.status === Status.SCHEDULED ||
          booking?.status === Status.CONFIRMED;
        const isSamePet = Number(booking?.petId) === Number(options.petId);
        const isUpcoming = isUpcomingBooking(
          booking?.date ?? "",
          booking?.start ?? "",
          utcToZonedTime(new Date(), shopTimezone),
        );

        if (isOpen && isSamePet && isUpcoming) {
          rescheduleBooking = booking;
        }

        logHandler("getAvailableTimes", {
          candidateBookingId,
          bookingStatus: booking?.status,
          bookingPetId: booking?.petId,
          bookingDate: booking?.date,
          isOpen,
          isSamePet,
          isUpcoming,
        });
      } catch (error) {
        // Agendamento inexistente, de outra loja ou API fora: tratamos como
        // agendamento novo, que é o ramo seguro.
        logHandler("getAvailableTimes", {
          candidateBookingId,
          bookingLookupFailed: true,
          error: (error as Error)?.message,
        });
      }
    }

    const isReschedule = rescheduleBooking !== null;

    logHandler("getAvailableTimes", {
      shopId: options.shopId,
      petId: options.petId,
      segmentType: options.segmentType,
      isReschedule,
      candidateBookingId,
      bookingId: rescheduleBooking?.id ?? null,
      rawBookingId,
    });

    let services: number[] = [];
    let combos: number[] = [];

    let selectedAdditionalIds: number[] = [];
    let groomAdditionalIds: number[] = [];

    if (rescheduleBooking) {
      // Lê do próprio agendamento em vez de `servicesIds`. Aquela variável tem
      // dois sentidos conforme o fluxo (serviços do agendamento na remarcação,
      // catálogo do menu no agendamento novo), e a remarcação só funcionava por
      // coincidência de preenchimento. Vindo do agendamento, a lista está certa
      // mesmo que este ramo seja alcançado indevidamente.
      services = rescheduleBooking.services.map((service) =>
        Number(service.id),
      );
      combos = rescheduleBooking.combos.map((combo) => Number(combo.id));
    } else {
      const parsedSelectedService: ServiceOptionType = JSON.parse(
        options.selectedService as string,
      );

      const selectedId = Number(parsedSelectedService.id);

      if (parsedSelectedService.type === "COMBO") {
        combos = [selectedId];
      } else {
        services = [selectedId];
      }

      selectedAdditionalIds = options.selectedAdditionals
        ? parseIds(options.selectedAdditionals)
        : [];

      const additionalOptions: ServiceOptionType[] = options.additionalOptions
        ? parseJsonArray<ServiceOptionType>(options.additionalOptions)
        : [];

      groomAdditionalIds = additionalOptions
        .filter(
          (additional) =>
            selectedAdditionalIds.includes(Number(additional.id)) &&
            additional.category?.type === "GROOM",
        )
        .map((additional) => Number(additional.id));

      if (groomAdditionalIds.length > 0) {
        services = [...services, ...groomAdditionalIds];
      }
    }

    logHandler("getAvailableTimes", {
      isReschedule,
      services,
      combos,
      selectedAdditionalIds: summarizeArray(selectedAdditionalIds),
      groomAdditionalIds: summarizeArray(groomAdditionalIds),
      catalogServices: summarizeArray(parseIds(rawServices)),
      catalogCombos: summarizeArray(parseIds(rawCombos)),
    });

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
          shopTimezone,
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
        break;
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
    variables.set([
      { id: options.groomAdditionalIds as string, value: groomAdditionalIds },
    ]);
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
