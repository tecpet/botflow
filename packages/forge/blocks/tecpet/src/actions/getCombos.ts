import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../constants";

export const getCombos = createAction({
  auth,
  baseOptions,
  name: "Buscar Combos com Preço da Loja",
  options: option.object({
    shopId: option.string.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.string.layout({
      label: "Id do Pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    combos: option.string.layout({
      label: "Combos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    combosNames: option.string.layout({
      label: "Combos Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    combosIds: option.string.layout({
      label: "Combos Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    combosPrices: option.string.layout({
      label: "Combos Preços",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    combosDescriptions: option.string.layout({
      label: "Combos Descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const combos = await tecpetSdk.combo.listPricing(options.petId, options.segmentType, options?.shopId);
        console.log(combos);
        if (combos) {
          if (options.combos) {
            variables.set([{id: options.combos, value: combos}]);
          }
          if (options.combosIds) {
            variables.set([{id: options.combos, value: combos.map(c => c.id)}]);
          }
          if (options.combosNames) {
            variables.set([{id: options.combosNames, value: combos.map(c => c.name)}]);
          }
          if (options.combosPrices) {
            variables.set([{id: options.combosPrices, value: combos.map(c => c.price)}]);
          }
          if (options.combosDescriptions) {
            variables.set([{id: options.combosDescriptions, value: combos.map(c => c.description)}]);
          }
        }
      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
