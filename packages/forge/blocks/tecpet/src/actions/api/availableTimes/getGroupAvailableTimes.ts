import {
  ChatbotTimeDisplayModeEnum,
  type PaEmployeeIndication,
  type PaGetAvailableTimesResponse,
  type PaGetAvailableTimesTimesBody,
  type PaGetBookingResponse,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { describeApiError } from "../../../helpers/apiErrors";
import {
  DEFAULT_SHOP_TIMEZONE,
  NOT_CONFIGURED_VALUES,
  resolveMinAdvanceHours,
} from "../../../helpers/bookingMinAdvance";
import {
  buildGroupCombinationsForDate,
  formatPtBrList,
  type GroupPetAvailability,
  type GroupTimeOption,
  thinGroupOptionsByInterval,
  timeToMinutes,
} from "../../../helpers/groupReschedule";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import {
  formatBRDate,
  formatISODate,
  parseJsonArray,
  safeJsonParse,
} from "../../../helpers/utils";
import { filterAvailableTimesByMinAdvance } from "./getAvailableTimes";

/**
 * Seletor de horários do reagendamento em grupo (TP-4108).
 *
 * Faz o que o `getAvailableTimes` faz, mas para N pets de uma vez — e devolve
 * uma opção por BLOCO, não por pet. Cada opção já traz o horário de cada pet
 * (`items`), então o tutor confirma o dia uma vez e o bloco de reagendamento
 * sabe exatamente o que gravar em cada agendamento.
 *
 * O trabalho difícil (encaixar os pets em sequência sem sobreposição) está no
 * `helpers/groupReschedule.ts`; aqui ficam as chamadas de API e os mesmos cortes
 * do seletor de um pet só.
 */
export const getGroupAvailableTimes = createAction({
  auth,
  baseOptions,
  name: "Buscar opções de horário para o grupo",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    groupBookings: option.string.layout({
      label: "Agendamentos do grupo",
      isRequired: true,
      helperText:
        "Saída do bloco Carregar agendamentos do grupo (JSON dos agendamentos)",
    }),
    employeeIndications: option.string.layout({
      label: "Funcionários indicados para o serviço",
      isRequired: false,
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: false,
      helperText: "Configurações da loja (usado para ler o fuso horário)",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Seletor de horários - Modo exibição dos horarios",
      placeholder: "Selecione",
      helperText: "Modo de exibição dos horários no seletor de horários",
    }),
    selectedTimeMinAdvanceHours: option.string.layout({
      label: "Tempo mínimo de antecedência para o horário selecionado",
      isRequired: false,
      helperText: "Tempo mínimo de antecedência para o horário selecionado",
    }),
    showOtherDates: option.string.layout({
      label: "Escolher outras datas disponiveis",
      isRequired: true,
      helperText: "Selecionado outras datas",
    }),
    getAdditionalDays: option.string.layout({
      label: "Quantidade de dias adicionais",
      isRequired: true,
      defaultValue: "0",
      helperText: "Buscar quantidade de dias atuais",
    }),
    inputAdditionalDays: option.string.layout({
      label: "Input de dias adicionais (saída)",
      helperText: "Dias para adicionar",
      inputType: "variableDropdown",
    }),
    groupAvailableTimes: option.string.layout({
      label: "Opções de horário do grupo (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "Recebe uma opção por bloco, no formato dos horários comuns — pode alimentar o Construir opções de horarios diposniveis",
    }),
    noTimesAvailable: option.string.layout({
      label: "Sem horários disponíveis (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText: "Recebe true quando a busca por outras datas se esgotou",
    }),
    noGroupCombinationAvailable: option.string.layout({
      label: "Nenhuma combinação para o grupo (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "Recebe true quando existiam horários por pet, mas nenhum dia comporta todos os pets. Use para oferecer reagendar só um pet ou o atendente.",
    }),
    groupUnavailablePetNames: option.string.layout({
      label: "Pets sem horário (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "Recebe os nomes dos pets que não tinham horário nenhum nas datas pesquisadas",
    }),
  }),
  getSetVariableIds: ({
    inputAdditionalDays,
    groupAvailableTimes,
    noTimesAvailable,
    noGroupCombinationAvailable,
    groupUnavailablePetNames,
  }) => {
    const variables = [];

    if (inputAdditionalDays) variables.push(inputAdditionalDays);
    if (groupAvailableTimes) variables.push(groupAvailableTimes);
    if (noTimesAvailable) variables.push(noTimesAvailable);
    if (noGroupCombinationAvailable)
      variables.push(noGroupCombinationAvailable);
    if (groupUnavailablePetNames) variables.push(groupUnavailablePetNames);

    return variables;
  },
});

// Mesmo teto de tentativas do seletor de um pet só: 10 dias adicionais, de 2 em 2.
const MAX_ATTEMPTS = 10;

// Teto de opções por dia. Sem ele, um dia inteiro livre para 3 pets geraria uma
// lista de dezenas de blocos — o modo de exibição da loja afina depois, mas o
// custo de montar (e serializar na variável do fluxo) já teria sido pago.
const MAX_COMBINATIONS_PER_DATE = 20;

const intervalMinutesByDisplayMode = (
  mode: ChatbotTimeDisplayModeEnum | null,
): number => {
  if (mode === ChatbotTimeDisplayModeEnum.THIRTY_MIN) return 30;
  if (mode === ChatbotTimeDisplayModeEnum.ONE_HOUR) return 60;
  return 0;
};

export const GetGroupAvailableTimesHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  const setVariable = (optionKey: string, value: unknown) => {
    const variableId = options[optionKey] as string;

    if (variableId) variables.set([{ id: variableId, value }]);
  };

  try {
    const shopId = Number(options.shopId);

    const bookings = parseJsonArray<PaGetBookingResponse>(
      options.groupBookings,
    ).filter((booking) => Boolean(booking?.id));

    const shopSettings = safeJsonParse<{ timeZone?: string } | undefined>(
      options.shopSettings,
      undefined,
    );
    const shopTimezone = shopSettings?.timeZone ?? DEFAULT_SHOP_TIMEZONE;

    const timeDisplayMode =
      (options.timeSelectionBehaviorTimeDisplayMode as ChatbotTimeDisplayModeEnum) ??
      null;

    // Mesmo tratamento do seletor de um pet só: o Typebot injeta variável nula
    // como a STRING "null", e `Number("null")` é NaN — que escapava do guard
    // `<= 0` e descartava todos os horários do dia (ver getAvailableTimes).
    const rawMinAdvanceHours = String(
      options.selectedTimeMinAdvanceHours ?? "",
    ).trim();
    const minAdvanceHours = resolveMinAdvanceHours(rawMinAdvanceHours, 0);

    if (
      !NOT_CONFIGURED_VALUES.has(rawMinAdvanceHours.toLowerCase()) &&
      !Number.isFinite(Number(rawMinAdvanceHours))
    ) {
      console.warn(
        "[getGroupAvailableTimes] antecedência mínima do seletor não é numérica — seguindo sem restrição",
        { rawMinAdvanceHours },
      );
    }

    const parsedEmployeeIndications = safeJsonParse<unknown[]>(
      options.employeeIndications,
      [],
    );

    const employeesIndication: PaEmployeeIndication[] = (
      Array.isArray(parsedEmployeeIndications) ? parsedEmployeeIndications : []
    )
      .map((item) =>
        typeof item === "string" ? safeJsonParse<unknown>(item, null) : item,
      )
      .filter((item): item is PaEmployeeIndication => item !== null);

    const showOtherDates = safeJsonParse<boolean>(
      options.showOtherDates,
      false,
    );

    let additionalDays = options.getAdditionalDays
      ? Number(options.getAdditionalDays)
      : 0;

    if (!Number.isFinite(additionalDays)) additionalDays = 0;

    if (showOtherDates) additionalDays += 2;

    const today = new Date();

    if (showOtherDates) today.setDate(today.getDate() + additionalDays);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const searchDates = [formatISODate(today), formatISODate(tomorrow)];

    logHandler("getGroupAvailableTimes", {
      shopId,
      bookings: summarizeArray(
        bookings.map((booking) => ({
          id: booking.id,
          petId: booking.petId,
          petName: booking.petName,
        })),
      ),
      searchDates,
      minAdvanceHours,
      timeDisplayMode,
      additionalDays,
      showOtherDates,
    });

    if (bookings.length === 0) {
      logHandler("getGroupAvailableTimes", {
        skipped: true,
        reason: "nenhum agendamento no grupo",
      });

      setVariable("inputAdditionalDays", additionalDays);
      setVariable("groupAvailableTimes", []);
      setVariable("noTimesAvailable", true);
      setVariable("noGroupCombinationAvailable", false);
      setVariable("groupUnavailablePetNames", "");
      return;
    }

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const groupOptions: GroupTimeOption[] = [];

    // Pet que não tem horário NENHUM nas datas pesquisadas: é o que explica ao
    // tutor por que o grupo não fechou (mensagem diferente de "a loja não tem
    // agenda"). Nome, e não id, porque vai para a mensagem.
    const petsWithoutTimes = new Set<string>();
    let anyPetHadTimes = false;

    for (const dateISO of searchDates) {
      const availabilities: GroupPetAvailability[] = [];
      let dateIsViable = true;

      for (const booking of bookings) {
        // Os serviços vêm do próprio agendamento, nunca do catálogo do menu:
        // reagendamento mantém o que foi contratado (mesma decisão do ramo de
        // remarcação do getAvailableTimes).
        const services = (booking.services ?? []).map((service) =>
          Number(service.id),
        );
        const combos = (booking.combos ?? []).map((combo) => Number(combo.id));

        const body: PaGetAvailableTimesTimesBody = {
          date: dateISO,
          combos,
          services,
          petId: Number(booking.petId),
          segment: booking.segmentType as ShopSegment,
          employeesIndication,
        };

        let times: PaGetAvailableTimesResponse[] = [];

        try {
          times = await tecpetSdk.availableTimes.list(body, shopId);
        } catch (error) {
          // Erro transitório da API em um pet invalida o DIA (não dá para
          // prometer um bloco sem saber a agenda dele), mas não a busca: as
          // outras datas seguem, como o `break` do seletor de um pet só.
          logHandler("getGroupAvailableTimes", {
            dateISO,
            bookingId: booking.id,
            availableTimesFailed: true,
            error: describeApiError(error),
          });
          dateIsViable = false;
          break;
        }

        const filtered = filterAvailableTimesByMinAdvance(
          times,
          minAdvanceHours,
          dateISO,
          shopTimezone,
        );

        if (filtered.length === 0) {
          petsWithoutTimes.add(booking.petName);
          dateIsViable = false;
          break;
        }

        anyPetHadTimes = true;

        availabilities.push({
          booking: {
            id: booking.id,
            petId: Number(booking.petId),
            petName: booking.petName,
          },
          times: filtered,
        });
      }

      if (!dateIsViable) continue;

      const combinations = thinGroupOptionsByInterval(
        buildGroupCombinationsForDate({
          availabilities,
          dateISO,
          dateBR: formatBRDate(dateISO),
          maxCombinations: MAX_COMBINATIONS_PER_DATE,
        }),
        intervalMinutesByDisplayMode(timeDisplayMode),
      );

      logHandler("getGroupAvailableTimes", {
        dateISO,
        pets: availabilities.length,
        timesPerPet: availabilities.map((availability) => ({
          petName: availability.booking.petName,
          times: availability.times.length,
        })),
        combinations: combinations.length,
      });

      groupOptions.push(...combinations);
    }

    groupOptions.sort(
      (a, b) =>
        a.dateISO.localeCompare(b.dateISO) ||
        (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0),
    );

    // "Nenhuma combinação" só faz sentido quando havia agenda: a loja fechada
    // nos dois dias segue pelo ramo normal de "sem horários", e oferecer
    // "reagendar só um pet" ali não resolveria nada.
    const noGroupCombinationAvailable =
      groupOptions.length === 0 && anyPetHadTimes;

    logHandler("getGroupAvailableTimes", {
      totalOptions: groupOptions.length,
      firstOptions: summarizeArray(
        groupOptions.map((groupOption) => ({
          id: groupOption.id,
          dateBR: groupOption.dateBR,
          start: groupOption.start,
          schedule: groupOption.scheduleSummary,
        })),
        3,
      ),
      noGroupCombinationAvailable,
      petsWithoutTimes: [...petsWithoutTimes],
      exhaustedAttempts: additionalDays > MAX_ATTEMPTS,
    });

    setVariable("inputAdditionalDays", additionalDays);
    setVariable("groupAvailableTimes", groupOptions);
    setVariable("noGroupCombinationAvailable", noGroupCombinationAvailable);
    setVariable(
      "groupUnavailablePetNames",
      formatPtBrList([...petsWithoutTimes]),
    );

    if (additionalDays > MAX_ATTEMPTS) setVariable("noTimesAvailable", true);
  } catch (error) {
    console.error(error);

    // Falha fechada, igual ao seletor de um pet só: sem gravar as saídas, a
    // aresta do fluxo volta a este bloco indefinidamente e a cota da credencial
    // global vai embora (TP-3635).
    logHandler("getGroupAvailableTimes", {
      handlerFailed: true,
      error: describeApiError(error),
    });

    setVariable("groupAvailableTimes", []);
    setVariable("noTimesAvailable", true);
    setVariable("noGroupCombinationAvailable", false);
    setVariable("groupUnavailablePetNames", "");
  }
};
