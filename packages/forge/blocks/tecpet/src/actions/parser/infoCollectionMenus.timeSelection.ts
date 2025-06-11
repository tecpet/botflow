import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const parseTimeSelection = createAction({
  baseOptions,
  name: "Construir configurações de seleção de horarios",
  options: option.object({
    selectedMenuConfigurations: option.string.layout({
      label: "Configurações do menu selecionado",
      isRequired: true,
      helperText: "Configurações",
    }),
    timeSelectionBehavior: option.string.layout({
      label: "Comportamento do seletor de horários",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorMessage: option.string.layout({
      label: "Comportamento do seletor de horários - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorMinAdvanceHours: option.string.layout({
      label: "Comportamento do seletor de horários - Tempo mínimo de antecedência",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorBehavior: option.string.layout({
      label: "Comportamento do seletor de horários - Comportamento",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Comportamento do seletor de horários - Modo de exibição de tempo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const selectedMenuConfig =
          typeof options.selectedMenuConfigurations === 'string'
            ? JSON.parse(options.selectedMenuConfigurations)
            : options.selectedMenuConfigurations as any;

        const infoCollectionMenus = selectedMenuConfig.infoCollectionMenus;
        const timeSelection = infoCollectionMenus.timeSelection;

        variables.set([{id: options.timeSelectionBehavior, value: timeSelection.timeSelectionBehavior}]);
        variables.set([{id: options.timeSelectionBehaviorMessage, value: timeSelection.timeSelectionBehavior.message}]);
        variables.set([{id: options.timeSelectionBehaviorMinAdvanceHours, value: timeSelection.timeSelectionBehavior.minAdvanceHours}]);
        variables.set([{id: options.timeSelectionBehaviorBehavior, value: timeSelection.timeSelectionBehavior.behavior}]);
        variables.set([{id: options.timeSelectionBehaviorTimeDisplayMode, value: timeSelection.timeSelectionBehavior.timeDisplayMode}]);

      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
