import { createAction, option } from "@typebot.io/forge";
import { type PaShopConfigurationsResponse, TecpetSDK } from "tecpet-sdk";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

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
    variableIdToSaveAll: option.string.layout({
      label: "Salvar configurações",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    chargeMode,
    variableIdToSaveAll,
    chargeModeBySizeAndHair,
    chargeModeByBreed,
  }) => {
    const variables: string[] = [];

    if (chargeMode) variables.push(chargeMode);

    if (chargeModeBySizeAndHair) variables.push(chargeModeBySizeAndHair);

    if (chargeModeByBreed) variables.push(chargeModeByBreed);

    if (chargeMode) variables.push(chargeMode);

    if (variableIdToSaveAll) variables.push(variableIdToSaveAll);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        if (options.shopId) {
          const tecpetSdk = new TecpetSDK(
            credentials.baseUrl ?? tecpetDefaultBaseUrl,
            credentials.apiKey,
          );

          const result: PaShopConfigurationsResponse =
            (await tecpetSdk.shop.getConfigurations(
              options.shopId,
            )) as PaShopConfigurationsResponse;

          if (result) {
            const chargeMode = result.advancedConfig?.global?.serviceByBreed
              ? "BREED"
              : "SIZE_AND_HAIR";
            if (options.chargeModeBySizeAndHair) {
              variables.set([
                { id: options.chargeModeBySizeAndHair, value: "SIZE_AND_HAIR" },
              ]);
            }
            if (options.chargeModeByBreed) {
              variables.set([
                { id: options.chargeModeByBreed, value: "BREED" },
              ]);
            }
            if (options.chargeMode) {
              variables.set([{ id: options.chargeMode, value: chargeMode }]);
            }
            if (options.variableIdToSaveAll) {
              variables.set([
                { id: options.variableIdToSaveAll, value: result },
              ]);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
