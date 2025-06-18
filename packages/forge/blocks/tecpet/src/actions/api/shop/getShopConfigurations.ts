import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

export const getShopConfigurations = createAction({
  auth,
  baseOptions,
  name: "Configurações da Loja",
  options: option.object({
    shopId: option.number.layout({
      label: "ID Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    chargeModeBySizeAndHair: option.string.layout({
      label: "Modo de Cobrança por porte e pelo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chargeModeByBreed: option.string.layout({
      label: "Modo de Cobrança por raça",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chargeMode: option.string.layout({
      label: "Modo de Cobrança",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({configurations}) =>
    configurations ? [configurations] : [],
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        if (options.shopId) {
          const tecpetSdk = new TecpetSDK(
            credentials.baseUrl ?? tecpetDefaultBaseUrl,
            credentials.apiKey,
          );
          const result = await tecpetSdk.shop.getConfigurations(
            options.shopId,
          );
          if (result) {
            const chargeMode = result.advancedConfig?.global?.serviceByBreed ? 'BREED' : 'SIZE_AND_HAIR';
            variables.set([{id: options.chargeModeBySizeAndHair, value: 'SIZE_AND_HAIR'}]);
            variables.set([{id: options.chargeModeByBreed, value: 'BREED'}]);
            variables.set([{id: options.chargeMode, value: chargeMode}]);
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
