import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

export const getSpecies = createAction({
  auth,
  baseOptions,
  name: "Buscar Espécies da Loja",
  options: option.object({
    shopId: option.string.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    species: option.string.layout({
      label: "Espécies",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    speciesIds: option.string.layout({
      label: "Espécies Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    speciesNames: option.string.layout({
      label: "Espécies Nomes",
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
        const species = await tecpetSdk.specie.list(options?.shopId);
        if (species) {
          if (options.species) {
            variables.set([{id: options.species, value: species}]);
          }
          if (options.speciesIds) {
            variables.set([{id: options.speciesIds, value: species.map(s => s.id)}]);
          }
          if (options.speciesNames) {
            variables.set([{id: options.speciesNames, value: species.map(s => s.name)}]);
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
