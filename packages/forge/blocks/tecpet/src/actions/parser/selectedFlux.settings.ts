import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const parseSelectedFluxSettings = createAction({
  baseOptions,
  name: "Construir configurações gerais do fluxo",
  options: option.object({
    selectedMenuConfigurations: option.string.layout({
      label: "Configurações do menu selecionado",
      isRequired: true,
      helperText: "Configurações",
    }),
    fluxId: option.string.layout({
      label: "Fluxo - Id",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxTypebotId: option.string.layout({
      label: "Fluxo - Typebot Id",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxName: option.string.layout({
      label: "Fluxo - Nome",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxType: option.string.layout({
      label: "Fluxo - Tipo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxMode: option.string.layout({
      label: "Fluxo - Modo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    schedulePermission: option.string.layout({
      label: "Fluxo - Quem pode agendar",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    conclusionMessage: option.string.layout({
      label: "Fluxo - Mensagem de Conclusão",
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

       

        variables.set([{id: options.fluxId as string, value: selectedMenuConfig.id ?? ''}]);
        variables.set([{id: options.fluxTypebotId as string, value: selectedMenuConfig.fluxId ?? ''}]);
        variables.set([{id: options.fluxName as string, value: selectedMenuConfig.name ?? ''}]);
        variables.set([{id: options.fluxType as string, value: selectedMenuConfig.type ?? ''}]);
        variables.set([{id: options.fluxMode as string, value: selectedMenuConfig.mode ?? ''}]);
        variables.set([{id: options.schedulePermission as string, value: selectedMenuConfig.schedulePermission ?? ''}]);
        variables.set([{id: options.conclusionMessage as string, value: selectedMenuConfig.conclusionMessage ?? ''}]);
      } catch (error) {
        console.error(error)
      }
    },
  },
});
