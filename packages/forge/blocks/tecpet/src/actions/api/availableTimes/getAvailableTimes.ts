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
import { utcToZonedTime } from "date-fns-tz";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import {
  isBookingWithinMinAdvanceHours,
  resolveMinAdvanceHours,
} from "../../../helpers/bookingMinAdvance";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import {
  extractBookingId,
  formatBRDate,
  formatISODate,
  isUpcomingBooking,
  parseIds,
  parseJsonArray,
  safeJsonParse,
} from "../../../helpers/utils";
import type { ServiceOptionType } from "../../internal/buildServiceOptions";

// Valores que significam "a loja não configurou a antecedência do seletor". O
// "null" entra aqui porque é o que o Typebot injeta quando a variável do fluxo
// está nula — não é erro de configuração, então não gera warn.
const NOT_CONFIGURED_VALUES = new Set(["", "null", "undefined"]);

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

    const parsedEmployeeIndications = safeJsonParse<unknown[]>(
      options.employeeIndications,
      [],
    );

    // Indicação malformada não deve impedir a busca de horários: seguimos sem
    // indicação em vez de derrubar o bloco.
    const employeesIndication: PaEmployeeIndication[] = (
      Array.isArray(parsedEmployeeIndications) ? parsedEmployeeIndications : []
    )
      .map((item) =>
        typeof item === "string" ? safeJsonParse<unknown>(item, null) : item,
      )
      .filter((item): item is PaEmployeeIndication => item !== null);

    const rawAdditionalDays = options.getAdditionalDays;

    const timeSelectionBehaviorTimeDisplayMode: ChatbotTimeDisplayModeEnum =
      (options.timeSelectionBehaviorTimeDisplayMode as ChatbotTimeDisplayModeEnum) ??
      null;

    const shopSettings = safeJsonParse<{ timeZone?: string } | undefined>(
      options.shopSettings,
      undefined,
    );

    // Campo correto é `timeZone` (Z maiúsculo); `timezone` vinha undefined.
    const shopTimezone = shopSettings?.timeZone ?? "America/Sao_Paulo";

    // O parser grava `timeSelectionBehavior.minAdvanceHours ?? null`, e o Typebot
    // injeta uma variável nula na option como a STRING "null". `Number("null")`
    // é NaN, e NaN escapava do guard `<= 0` — o corte então rodava com
    // `cutOffMinutes: NaN` e descartava TODOS os horários de hoje, deixando o
    // cliente sem horário para a data atual. Sem valor utilizável = sem
    // restrição, que era a intenção do `?? 0` original.
    const rawMinAdvanceHours = String(
      options.selectedTimeMinAdvanceHours ?? "",
    ).trim();
    const isMinAdvanceConfigured = !NOT_CONFIGURED_VALUES.has(
      rawMinAdvanceHours.toLowerCase(),
    );
    const selectedTimeMinAdvanceHours = resolveMinAdvanceHours(
      rawMinAdvanceHours,
      0,
    );

    if (
      isMinAdvanceConfigured &&
      !Number.isFinite(Number(rawMinAdvanceHours))
    ) {
      console.warn(
        "[getAvailableTimes] antecedência mínima do seletor não é numérica — seguindo sem restrição",
        { rawMinAdvanceHours },
      );
    }

    const rawServices = safeJsonParse<unknown[]>(options.servicesIds, []);
    const rawCombos = safeJsonParse<unknown[]>(options.combosIds, []);

    // Texto livre não-JSON nesse campo não deve abortar a busca de horários.
    const rawBookingId = safeJsonParse<unknown>(options.bookingId, null);

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
      services = (rescheduleBooking.services ?? []).map((service) =>
        Number(service.id),
      );
      combos = (rescheduleBooking.combos ?? []).map((combo) =>
        Number(combo.id),
      );
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
      // Sem parseIds aqui: ele lança por contrato, e log de diagnóstico não
      // pode ser capaz de derrubar o handler.
      catalogServices: summarizeArray(rawServices),
      catalogCombos: summarizeArray(rawCombos),
    });

    let additionalDays = rawAdditionalDays ? Number(rawAdditionalDays) : 0;

    const showOtherDates = safeJsonParse<boolean>(
      options.showOtherDates,
      false,
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

    // Falha do bloco não pode deixar o fluxo reentrando. Sem gravar as
    // variáveis de saída, `inputAdditionalDays` e `availableTimes` ficam com o
    // valor anterior e a aresta do fluxo volta a este bloco indefinidamente —
    // foi o que consumiu a cota da credencial global e derrubou o chatbot de
    // todas as lojas (TP-3635).
    //
    // Falhamos fechado, saindo pelo ramo de "sem horários disponíveis" que já
    // existe. Isso é correto aqui porque este catch só é alcançado por erro
    // determinístico: a chamada de horários tem catch próprio que faz `break`
    // (erro transitório de API segue o fluxo normal) e o booking.get também.
    // O que chega aqui não melhora com nova tentativa.
    logHandler("getAvailableTimes", {
      handlerFailed: true,
      error: (error as Error)?.message,
    });

    variables.set([
      { id: options.noTimesAvailable as string, value: true },
      { id: options.availableTimes as string, value: [] },
    ]);
  }
};

function getMinutesFromMidnight(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Descarta os horários que não respeitam a antecedência mínima do seletor.
 *
 * Compara instantes completos (data + hora) no fuso da loja. Antes o corte era
 * feito em "minutos desde a meia-noite" e só valia quando `dateContext` era
 * HOJE — qualquer outra data saía inteira pelo `if (!isToday) return times`.
 * Isso fazia a antecedência do seletor ser ignorada em todos os horários de
 * amanhã e, no ramo de "outras datas" (onde a data base é deslocada para
 * frente), em todos os horários oferecidos.
 */
export function filterAvailableTimesByMinAdvance(
  times: PaGetAvailableTimesResponse[],
  minAdvanceHours: number,
  dateContext: string,
  shopTimezone: string,
): PaGetAvailableTimesResponse[] {
  if (
    !Number.isFinite(minAdvanceHours) ||
    minAdvanceHours <= 0 ||
    times.length === 0
  ) {
    return times;
  }

  const filtered = times.filter((time) => {
    const allowed = isBookingWithinMinAdvanceHours({
      date: dateContext,
      start: time.start,
      minAdvanceHours,
      shopTimezone,
    });

    // `null` = não foi possível calcular o início. Mantemos o horário: a API é a
    // fonte da verdade sobre o slot existir, e esconder a agenda inteira por um
    // formato inesperado deixa o cliente sem opção nenhuma.
    return allowed !== false;
  });

  logHandler("getAvailableTimes", {
    minAdvanceFilter: {
      dateContext,
      minAdvanceHours,
      shopTimezone,
      before: times.length,
      after: filtered.length,
    },
  });

  return filtered;
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
