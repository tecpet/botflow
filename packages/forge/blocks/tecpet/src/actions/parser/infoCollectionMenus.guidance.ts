import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const parseGuidance = createAction({
  baseOptions,
  name: "Construir configurações de passar pro atendente",
  options: option.object({
    selectedMenuConfigurations: option.string.layout({
      label: "Configurações do menu selecionado",
      isRequired: true,
      helperText: "Configurações",
    }),
    guidanceMessage: option.string.layout({
      label: "Orientação - Mensagem",
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
        const guidance = infoCollectionMenus.guidance.guidanceMessage;
        variables.set([{id: options.guidanceMessage, value: guidance.message ?? ''}]);

      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
