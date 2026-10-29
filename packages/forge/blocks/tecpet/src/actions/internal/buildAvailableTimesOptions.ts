import type { PaGetAvailableTimesResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { safeJsonParse } from "../../helpers/utils";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";

/** Opção que pede a próxima janela de datas. */
export const OTHER_DATES_OPTION_ID = "OTHER";

/**
 * Opção que refaz a busca da remarcação com todos os profissionais (TP-5050).
 * O fluxo reconhece este id no horário escolhido.
 */
export const OTHER_EMPLOYEES_OPTION_ID = "OTHER_EMPLOYEES";

// Ações vêm sem data e são exibidas pelo próprio rótulo. O título de cada linha
// da lista do WhatsApp tem no máximo 24 caracteres: o gateway corta o resto.
const ACTION_OPTION_IDS = new Set([
  OTHER_DATES_OPTION_ID,
  OTHER_EMPLOYEES_OPTION_ID,
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
      helperText: "Modo de exibição. Exemplo: de 30 em 30 min",
    }),
    showOtherEmployeesOption: option.string.layout({
      label: "Mostrar opção de outros profissionais",
      isRequired: false,
      helperText:
        'Quando "true", adiciona "VER OUTROS PROFISSIONAIS" logo abaixo de "PREFIRO OUTRA DATA" (id OTHER_EMPLOYEES). Ligue na saída "Outros profissionais disponíveis" da busca de horários.',
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

    availableTimes.push(
      buildActionOption(OTHER_DATES_OPTION_ID, "PREFIRO OUTRA DATA"),
    );

    if (
      safeJsonParse<boolean>(options.showOtherEmployeesOption, false) === true
    )
      availableTimes.push(
        buildActionOption(
          OTHER_EMPLOYEES_OPTION_ID,
          "VER OUTROS PROFISSIONAIS",
        ),
      );

    logHandler("buildAvailableTimesOptions", {
      outputAvailableTimes: summarizeArray(
        availableTimes.map((t) => ({
          id: t.id,
          dateBR: t.dateBR,
          scheduleStartTime: t.scheduleStartTime,
        })),
      ),
    });

    variables.set([
      {
        id: options.availableTimesValues as string,
        value: availableTimes.map((t) => t),
      },
      {
        id: options.availableTimesStartAndStop as string,
        value: availableTimes.map((t) =>
          ACTION_OPTION_IDS.has(t.id)
            ? t.scheduleStartTime
            : "Dia " + formatDateBR(t.dateBR) + " ás " + t.scheduleStartTime,
        ),
      },
      {
        id: options.availableTimesDates as string,
        value: availableTimes.map((t) => formatDateBR(t.dateBR)),
      },
    ]);
  } catch (error) {
    console.error(error);
  }
};
