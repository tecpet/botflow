import type { PaGetAvailableTimesResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { isSmartTimeDisplayMode } from "../../helpers/timeDisplayGrid";
import {
  normalizeTimesPage,
  paginateTimes,
  SMART_LIST_MAX_OPTIONS,
} from "../../helpers/timeListPagination";
import { safeJsonParse } from "../../helpers/utils";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";

/** Opção que pede a próxima janela de datas. */
export const OTHER_DATES_OPTION_ID = "OTHER";

/**
 * Opção que refaz a busca da remarcação com todos os profissionais (TP-5050).
 * O fluxo reconhece este id no horário escolhido.
 */
export const OTHER_EMPLOYEES_OPTION_ID = "OTHER_EMPLOYEES";

/**
 * Opção que mostra a próxima página dos mesmos dias, no modo de exibição SMART.
 * O fluxo reconhece este id, soma 1 na página e volta para este bloco.
 */
export const MORE_TIMES_OPTION_ID = "MORE_TIMES";

// Ações vêm sem data e são exibidas pelo próprio rótulo. O título de cada linha
// da lista do WhatsApp tem no máximo 24 caracteres: o gateway corta o resto.
const ACTION_OPTION_IDS = new Set([
  OTHER_DATES_OPTION_ID,
  OTHER_EMPLOYEES_OPTION_ID,
  MORE_TIMES_OPTION_ID,
]);

const buildActionOption = (
  id: string,
  label: string,
): PaGetAvailableTimesResponse & AvailableTimeType => ({
  id,
  scheduleStartTime: label,
  dateBR: "",
  start: "",
  dateISO: "",
  stop: "",
});

export const buildAvailableTimesOptions = createAction({
  baseOptions,
  name: "Construir opções de horarios diposniveis",
  options: option.object({
    availableTimes: option.string.layout({
      label: "Horários disponiveis",
      isRequired: true,
      helperText: "Horários disponiveis para hoje e amanhã",
    }),
    timeSelectionBehaviorBehavior: option.string.layout({
      label: "Comportamento do seletor de horários - Comportamento",
      isRequired: true,
      helperText: "Comportamento",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Comportamento do seletor de horários - Modo exibição",
      isRequired: true,
      helperText:
        'Modo de exibição. Exemplo: de 30 em 30 min. No modo SMART a lista tem até 10 linhas e os horários que não couberem saem em "VER MAIS HORÁRIOS" (id MORE_TIMES).',
    }),
    showOtherEmployeesOption: option.string.layout({
      label: "Mostrar opção de outros profissionais",
      isRequired: false,
      helperText:
        'Quando "true", adiciona "VER OUTROS PROFISSIONAIS" logo abaixo de "PREFIRO OUTRA DATA" (id OTHER_EMPLOYEES). Ligue na saída "Outros profissionais disponíveis" da busca de horários.',
    }),
    timesPage: option.string.layout({
      label: "Página dos horários",
      isRequired: false,
      helperText:
        'Página exibida no modo SMART (0 = primeira). Some 1 quando o cliente escolher "VER MAIS HORÁRIOS" e volte a 0 em qualquer outra escolha. Depois da última página, a lista volta para a primeira.',
    }),
    availableTimesValues: option.string.layout({
      label: "Array de horarios disponiveis ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    availableTimesStartAndStop: option.string.layout({
      label: "Array de horarios disponiveis inicio e fim",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    availableTimesDates: option.string.layout({
      label: "Array de horarios disponiveis datas",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    availableTimesValues,
    availableTimesStartAndStop,
    availableTimesDates,
  }) => {
    const variables: Array<string> = [];

    if (availableTimesValues) variables.push(availableTimesValues);

    if (availableTimesStartAndStop) variables.push(availableTimesStartAndStop);

    if (availableTimesDates) variables.push(availableTimesDates);

    return variables;
  },
});

const formatDateBR = (dateBR: string): string => {
  const parts = dateBR.split("/");
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return dateBR;
};

export const BuildAvailableTimesOptionsHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const availableTimesRaw: string[] = options.availableTimes
      ? (JSON.parse(options.availableTimes as string) ?? [])
      : [];

    const availableTimes: Array<
      PaGetAvailableTimesResponse & AvailableTimeType
    > = availableTimesRaw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    );

    logHandler("buildAvailableTimesOptions", {
      inputAvailableTimes: summarizeArray(
        availableTimes.map((t) => ({
          id: t.id,
          dateBR: t.dateBR,
          scheduleStartTime: t.scheduleStartTime,
        })),
      ),
      behavior: options.timeSelectionBehaviorBehavior,
      displayMode: options.timeSelectionBehaviorTimeDisplayMode,
    });

    const actionOptions = [
      buildActionOption(OTHER_DATES_OPTION_ID, "PREFIRO OUTRA DATA"),
    ];

    if (
      safeJsonParse<boolean>(options.showOtherEmployeesOption, false) === true
    )
      actionOptions.push(
        buildActionOption(
          OTHER_EMPLOYEES_OPTION_ID,
          "VER OUTROS PROFISSIONAIS",
        ),
      );

    // Nos outros modos a lista vai inteira, como antes. No SMART ela é
    // paginada, e as opções fixas ficam sempre na página para o cliente ter
    // saída.
    const isSmart = isSmartTimeDisplayMode(
      options.timeSelectionBehaviorTimeDisplayMode,
    );

    const timesPage = isSmart
      ? paginateTimes(availableTimes, {
          maxTimes: SMART_LIST_MAX_OPTIONS - actionOptions.length,
          page: normalizeTimesPage(options.timesPage),
        })
      : { times: availableTimes, pageIndex: 0, pageCount: 1 };

    const listedOptions = [
      ...timesPage.times,
      ...(timesPage.pageCount > 1
        ? [buildActionOption(MORE_TIMES_OPTION_ID, "VER MAIS HORÁRIOS")]
        : []),
      ...actionOptions,
    ];

    logHandler("buildAvailableTimesOptions", {
      pagination: {
        isSmart,
        requestedPage: options.timesPage ?? null,
        pageIndex: timesPage.pageIndex,
        pageCount: timesPage.pageCount,
        totalTimes: availableTimes.length,
        listedTimes: timesPage.times.length,
      },
      outputAvailableTimes: summarizeArray(
        listedOptions.map((t) => ({
          id: t.id,
          dateBR: t.dateBR,
          scheduleStartTime: t.scheduleStartTime,
        })),
      ),
    });

    variables.set([
      {
        id: options.availableTimesValues as string,
        value: listedOptions,
      },
      {
        id: options.availableTimesStartAndStop as string,
        value: listedOptions.map((t) =>
          ACTION_OPTION_IDS.has(t.id)
            ? t.scheduleStartTime
            : "Dia " + formatDateBR(t.dateBR) + " ás " + t.scheduleStartTime,
        ),
      },
      {
        id: options.availableTimesDates as string,
        value: listedOptions.map((t) => formatDateBR(t.dateBR)),
      },
    ]);
  } catch (error) {
    console.error(error);
  }
};
