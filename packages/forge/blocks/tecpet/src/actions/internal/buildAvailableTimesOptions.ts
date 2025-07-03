import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

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
      label: "Comportamento do seletor de horários - Tempo mínimo de antecedência",
      isRequired: true,
      helperText: "Tempo mínimo de antecedência para selecionar horários disponiveis. Exemplo: 2 horas",
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
    availableTimesIds: option.string.layout({
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
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const availableTimesRaw = typeof options.availableTimes === 'string' ? JSON.parse(options.availableTimes) : options.availableTimes as any;

        console.log('Tempos disponiveis',availableTimesRaw);
        const availableTimes = availableTimesRaw.map(item => typeof item === 'string' ? JSON.parse(item) : item);

        // TODO: remove and format available times according to config...

        variables.set([
          {id: options.availableTimesIds, value: availableTimes.map(t => t.id)},
          {id: options.availableTimesStartAndStop, value: availableTimes.map(t => t.startStop)},
          {id: options.availableTimesDates, value: availableTimes.map(t => t.dateBR)}
        ]);
      } catch (error) {
       console.error(error)
      }
    }
    ,
  },
});
