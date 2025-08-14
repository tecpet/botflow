import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";

export const buildAvailableTimesOptions = createAction({
  baseOptions,
  name: "Construir opções de horarios diposniveis",
  options: option.object({
    availableTimes: option.string.layout({
      label: "Horários disponiveis",
      isRequired: true,
      helperText: "Horários disponiveis para hoje e amanhã",
    }),
    timeSelectionBehaviorMinAdvanceHours: option.string.layout({
      label:
        "Comportamento do seletor de horários - Tempo mínimo de antecedência",
      isRequired: true,
      helperText:
        "Tempo mínimo de antecedência para selecionar horários disponiveis. Exemplo: 2 horas",
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
  run: {
    server: async ({ options, variables }) => {
      try {
        const availableTimesRaw: AvailableTimeType[] =
          JSON.parse(options.availableTimes as string) ?? [];

        const availableTimes = availableTimesRaw.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );

        availableTimes.push({
          id: "OTHER",
          startStop: "PREFIRO OUTRA DATA",
          dateBR: "",
        });

        variables.set([
          {
            id: options.availableTimesValues as string,
            value: availableTimes.map((t) => t),
          },
          {
            id: options.availableTimesStartAndStop as string,
            value: availableTimes.map((t) => t.startStop),
          },
          {
            id: options.availableTimesDates as string,
            value: availableTimes.map((t) => t.dateBR),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
