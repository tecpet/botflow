import {
  type PaEmployeeIndication,
  type PaGetAvailableTimesResponse,
  type PaGetAvailableTimesTimesBody,
  type PaGetBookingResponse,
  type PaShopConfigurationsSegment,
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
  timeToMinutes,
} from "../../../helpers/groupReschedule";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import {
  buildRescheduleEmployeeIndication,
  EmployeeFallbackReason,
  findUnavailableIndications,
  type RescheduleEmployeeSearch,
  resolveDroppedEmployeeNames,
  searchKeepingRescheduleEmployees,
} from "../../../helpers/rescheduleEmployees";
import {
  filterByDisplayGrid,
  intervalMinutesByDisplayMode,
  resolveDisplayGridOrigin,
} from "../../../helpers/timeDisplayGrid";
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
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: false,
      helperText:
        "Configurações da loja (usado para ler o fuso horário e a abertura do segmento)",
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
    employeeFallback: option.string.layout({
      label: "Remarcação com outro profissional (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "Recebe true quando algum pet teve o profissional do agendamento trocado porque ele não tinha horário. Use para avisar o cliente junto com os horários, em vez de perguntar antes.",
    }),
    employeeFallbackReason: option.string.layout({
      label: "Motivo da troca de profissional (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "NO_TIMES: o profissional não tem horário nos dias buscados. EMPLOYEE_UNAVAILABLE: algum profissional trocado está inativo ou não atende mais a categoria; nunca ofereça outra data com ele. Vazio quando não houve troca.",
    }),
    employeeFallbackPetNames: option.string.layout({
      label: "Pets que trocaram de profissional (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        "Nomes dos pets cujo profissional foi trocado. Os outros pets continuam com o profissional do agendamento. Vazio quando não houve troca.",
    }),
    replacedEmployeeNames: option.string.layout({
      label: "Profissionais trocados (saída)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
      helperText:
        'Nomes dos profissionais que ficaram de fora da busca (ex.: "Maria" ou "Maria e João"). Vazio quando não houve troca.',
    }),
  }),
  getSetVariableIds: ({
    inputAdditionalDays,
    groupAvailableTimes,
    noTimesAvailable,
    noGroupCombinationAvailable,
    groupUnavailablePetNames,
    employeeFallback,
    employeeFallbackReason,
    employeeFallbackPetNames,
    replacedEmployeeNames,
  }) => {
    const variables = [];

    if (inputAdditionalDays) variables.push(inputAdditionalDays);
    if (groupAvailableTimes) variables.push(groupAvailableTimes);
    if (noTimesAvailable) variables.push(noTimesAvailable);
    if (noGroupCombinationAvailable)
      variables.push(noGroupCombinationAvailable);
    if (groupUnavailablePetNames) variables.push(groupUnavailablePetNames);
    if (employeeFallback) variables.push(employeeFallback);
    if (employeeFallbackReason) variables.push(employeeFallbackReason);
    if (employeeFallbackPetNames) variables.push(employeeFallbackPetNames);
    if (replacedEmployeeNames) variables.push(replacedEmployeeNames);

    return variables;
  },
});

// Horários de um pet na janela, por dia, já com o corte de antecedência.
// `null` no dia = a API falhou nessa data.
type PetWindowTimes = Map<string, PaGetAvailableTimesResponse[] | null>;

const petHasTimes = (times: PetWindowTimes) =>
  [...times.values()].some((dayTimes) => (dayTimes?.length ?? 0) > 0);

// Mesmo teto de tentativas do seletor de um pet só: 10 dias adicionais, de 2 em 2.
const MAX_ATTEMPTS = 10;

// Teto de opções por dia. Sem ele, um dia inteiro livre para 3 pets geraria uma
// lista de dezenas de blocos (no modo ALL, um a cada `timeCycle`). A grade do
// modo de exibição é aplicada nas âncoras antes, então o teto conta só blocos
// que serão ofertados.
const MAX_COMBINATIONS_PER_DATE = 20;

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

  // Sempre gravadas, inclusive sem troca: as variáveis duram a sessão inteira, e
  // um `true` de uma busca anterior faria o fluxo avisar uma troca que não houve.
  const setEmployeeFallbackOutputs = (outputs: {
    employeeFallback: boolean;
    employeeFallbackReason: string;
    employeeFallbackPetNames: string;
    replacedEmployeeNames: string;
  }) => {
    for (const [optionKey, value] of Object.entries(outputs))
      setVariable(optionKey, value);
  };

  const noEmployeeFallback = {
    employeeFallback: false,
    employeeFallbackReason: "",
    employeeFallbackPetNames: "",
    replacedEmployeeNames: "",
  };

  try {
    const shopId = Number(options.shopId);

    const bookings = parseJsonArray<PaGetBookingResponse>(
      options.groupBookings,
    ).filter((booking) => Boolean(booking?.id));

    const shopSettings = safeJsonParse<
      | { timeZone?: string; segments?: PaShopConfigurationsSegment[] }
      | undefined
    >(options.shopSettings, undefined);
    const shopTimezone = shopSettings?.timeZone ?? DEFAULT_SHOP_TIMEZONE;

    const timeDisplayMode = options.timeSelectionBehaviorTimeDisplayMode;
    const displayIntervalMinutes =
      intervalMinutesByDisplayMode(timeDisplayMode);

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
      setEmployeeFallbackOutputs(noEmployeeFallback);
      return;
    }

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    // Cada pet mantém o profissional do próprio agendamento — irmãos podem estar
    // com profissionais diferentes, então a indicação é por pet (TP-4662).
    const employeesIndicationByBooking = new Map(
      bookings.map((booking) => [
        booking.id,
        buildRescheduleEmployeeIndication(booking),
      ]),
    );

    const fetchPetTimes = async (
      booking: PaGetBookingResponse,
      indication: PaEmployeeIndication[],
    ): Promise<PetWindowTimes> => {
      // Os serviços vêm do próprio agendamento, nunca do catálogo do menu:
      // reagendamento mantém o que foi contratado (mesma decisão do ramo de
      // remarcação do getAvailableTimes).
      const services = (booking.services ?? []).map((service) =>
        Number(service.id),
      );
      const combos = (booking.combos ?? []).map((combo) => Number(combo.id));

      const timesByDate: PetWindowTimes = new Map();

      for (const dateISO of searchDates) {
        const body: PaGetAvailableTimesTimesBody = {
          date: dateISO,
          combos,
          services,
          petId: Number(booking.petId),
          segment: booking.segmentType as ShopSegment,
          employeesIndication: indication,
          // O agendamento que está sendo movido não pode ocupar a agenda do
          // próprio profissional (mesma razão do getAvailableTimes).
          bookingId: booking.id,
        };

        try {
          const times = await tecpetSdk.availableTimes.list(body, shopId);

          timesByDate.set(
            dateISO,
            filterAvailableTimesByMinAdvance(
              times,
              minAdvanceHours,
              dateISO,
              shopTimezone,
            ),
          );
        } catch (error) {
          // Erro da API em um pet invalida o DIA (não dá para prometer um
          // bloco sem saber a agenda dele), mas não a busca: as outras datas
          // seguem, como no seletor de um pet só.
          logHandler("getGroupAvailableTimes", {
            dateISO,
            bookingId: booking.id,
            employeesIndication: indication,
            availableTimesFailed: true,
            error: describeApiError(error),
          });
          timesByDate.set(dateISO, null);
        }
      }

      return timesByDate;
    };

    // Memoizado por pet + indicação: o fallback de um pet e o fallback geral
    // podem repetir a mesma busca.
    const petTimesCache = new Map<string, Promise<PetWindowTimes>>();

    const searchPetTimes = (
      booking: PaGetBookingResponse,
      indication: PaEmployeeIndication[],
    ) => {
      const cacheKey = `${booking.id}|${indication
        .map((item) => `${item.id}:${item.serviceCategoryId}`)
        .join(",")}`;
      const cached = petTimesCache.get(cacheKey);

      if (cached) return cached;

      const search = fetchPetTimes(booking, indication);
      petTimesCache.set(cacheKey, search);

      return search;
    };

    // O fallback é por pet (TP-4863): só sai da indicação o pet cujo
    // profissional não tem horário na janela, e dentro dele só o profissional
    // que trava a busca. Antes, um profissional bloqueado trocava o
    // profissional de todos os pets do grupo.
    const employeeSearchByBooking = new Map<
      number,
      RescheduleEmployeeSearch<PetWindowTimes>
    >();

    for (const booking of bookings) {
      employeeSearchByBooking.set(
        booking.id,
        await searchKeepingRescheduleEmployees({
          indication: employeesIndicationByBooking.get(booking.id) ?? [],
          search: (indication) => searchPetTimes(booking, indication),
          hasTimes: petHasTimes,
          findUnavailable: (indication) =>
            findUnavailableIndications(tecpetSdk, shopId, indication),
        }),
      );
    }

    const buildGroupOptions = (stage: "perPet" | "allEmployees") => {
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
          const times = employeeSearchByBooking
            .get(booking.id)
            ?.result.get(dateISO);

          // Falha da API nesse dia (ver fetchPetTimes): o dia sai sem culpar
          // o pet.
          if (!times) {
            dateIsViable = false;
            break;
          }

          if (times.length === 0) {
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
            times,
          });
        }

        if (!dateIsViable) continue;

        // Mesma grade do seletor de um pet só (TP-4816), olhando o início do
        // BLOCO — o horário do primeiro pet, cujo segmento define a abertura.
        // Só a âncora precisa cair na grade; os irmãos encaixam em sequência
        // em qualquer slot. Afinar as âncoras ANTES de combinar faz o teto de
        // combinações por dia contar só blocos que serão ofertados — afinando
        // depois, um dia com :00/:30 ocupados esgotava o teto em blocos fora
        // da grade e ficava vazio.
        const [anchorAvailability, ...siblingAvailabilities] = availabilities;

        const combinations = buildGroupCombinationsForDate({
          availabilities: [
            {
              ...anchorAvailability,
              times: filterByDisplayGrid(
                anchorAvailability.times,
                displayIntervalMinutes,
                resolveDisplayGridOrigin({
                  shopSettings,
                  segmentType: bookings[0].segmentType,
                  dateISO,
                }),
              ),
            },
            ...siblingAvailabilities,
          ],
          dateISO,
          dateBR: formatBRDate(dateISO),
          maxCombinations: MAX_COMBINATIONS_PER_DATE,
        });

        logHandler("getGroupAvailableTimes", {
          dateISO,
          stage,
          pets: availabilities.length,
          timesPerPet: availabilities.map((availability) => ({
            petName: availability.booking.petName,
            times: availability.times.length,
          })),
          combinations: combinations.length,
        });

        groupOptions.push(...combinations);
      }

      return { groupOptions, petsWithoutTimes, anyPetHadTimes };
    };

    const perPetSearch = buildGroupOptions("perPet");

    // Cada pet tem horário sozinho, mas nenhum dia fecha o grupo com os
    // profissionais que sobraram: último recurso, qualquer profissional para
    // todos. É a garantia de antes da TP-4863, de a preferência não deixar o
    // grupo sem horário. Se algum pet não tem horário nem sem indicação, o
    // grupo não fecha de jeito nenhum, e trocar os outros não adiantaria.
    const searches = [...employeeSearchByBooking.values()];
    const groupWideFallback =
      perPetSearch.groupOptions.length === 0 &&
      searches.every((search) => petHasTimes(search.result)) &&
      searches.some((search) => search.indication.length > 0);

    if (groupWideFallback) {
      for (const booking of bookings) {
        const search = employeeSearchByBooking.get(booking.id);

        if (!search || search.indication.length === 0) continue;

        employeeSearchByBooking.set(booking.id, {
          result: await searchPetTimes(booking, []),
          indication: [],
          dropped: employeesIndicationByBooking.get(booking.id) ?? [],
          reason: search.reason ?? EmployeeFallbackReason.NO_TIMES,
        });
      }
    }

    const { groupOptions, petsWithoutTimes, anyPetHadTimes } = groupWideFallback
      ? buildGroupOptions("allEmployees")
      : perPetSearch;

    const replacedBookings = bookings.filter(
      (booking) =>
        (employeeSearchByBooking.get(booking.id)?.dropped.length ?? 0) > 0,
    );
    const replacedReasons = replacedBookings.map(
      (booking) => employeeSearchByBooking.get(booking.id)?.reason,
    );

    const employeeFallbackOutputs = {
      employeeFallback: replacedBookings.length > 0,
      employeeFallbackReason: replacedReasons.includes(
        EmployeeFallbackReason.EMPLOYEE_UNAVAILABLE,
      )
        ? EmployeeFallbackReason.EMPLOYEE_UNAVAILABLE
        : replacedBookings.length > 0
          ? EmployeeFallbackReason.NO_TIMES
          : "",
      employeeFallbackPetNames: formatPtBrList(
        replacedBookings.map((booking) => booking.petName),
      ),
      replacedEmployeeNames: formatPtBrList([
        ...new Set(
          replacedBookings.flatMap((booking) =>
            resolveDroppedEmployeeNames(
              booking,
              employeeSearchByBooking.get(booking.id)?.dropped ?? [],
            ),
          ),
        ),
      ]),
    };

    logHandler("getGroupAvailableTimes", {
      employeesIndication: bookings.map((booking) => {
        const search = employeeSearchByBooking.get(booking.id);

        return {
          bookingId: booking.id,
          indication: employeesIndicationByBooking.get(booking.id) ?? [],
          usedIndication: search?.indication ?? [],
          reason: search?.reason ?? null,
        };
      }),
      groupWideFallback,
      ...employeeFallbackOutputs,
    });

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
    setEmployeeFallbackOutputs(employeeFallbackOutputs);

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
    setEmployeeFallbackOutputs(noEmployeeFallback);
  }
};
