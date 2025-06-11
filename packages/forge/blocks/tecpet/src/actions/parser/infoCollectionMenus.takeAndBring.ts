import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const parseTakeAndBring = createAction({
  baseOptions,
  name: "Construir configurações de leva e traz",
  options: option.object({
    selectedMenuConfigurations: option.string.layout({
      label: "Configurações do menu selecionado",
      isRequired: true,
      helperText: "Configurações",
    }),
    takeAndBringEnabled: option.string.layout({
      label: "Leva e Traz - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringMessage: option.string.layout({
      label: "Leva e Traz - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringMinAdvanceHours: option.string.layout({
      label: "Leva e Traz - Antecedencia",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        console.log('1231321312312');

        const selectedMenuConfig =
          typeof options.selectedMenuConfigurations === 'string'
            ? JSON.parse(options.selectedMenuConfigurations)
            : options.selectedMenuConfigurations as any;

        const infoCollectionMenus = selectedMenuConfig.infoCollectionMenus;
        const allowTakeAndBring = infoCollectionMenus.takeAndBring.allowTakeAndBring;
        console.log('2- 1231321312312');

        console.log(allowTakeAndBring);
        console.log('3-- 1231321312312');

        variables.set([{id: options.takeAndBringEnabled, value: Boolean(allowTakeAndBring.enabled)}]);
        variables.set([{id: options.takeAndBringMessage, value: allowTakeAndBring.message ?? ''}]);
        variables.set([{id: options.takeAndBringMinAdvanceHours, value: allowTakeAndBring.minAdvanceHours ?? ''}]);
        console.log('4- 1231321312312');

      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
