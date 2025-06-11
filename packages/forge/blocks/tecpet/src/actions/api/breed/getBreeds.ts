import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { getSimilarBreeds } from "../../../helpers/utils";

export const getBreeds = createAction({
  auth,
  baseOptions,
  name: "Buscar Raças",
  options: option.object({
    shopId: option.string.layout({
      label: "Id da Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    specie: option.string.layout({
      label: "Espécie",
      isRequired: true,
      helperText: "Espécie do Pet",
    }),
    name: option.string.layout({
      label: "Nome",
      isRequired: true,
      helperText: "Raça",
    }),
    breeds: option.string.layout({
      label: "Raças",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    breedsIds: option.string.layout({
      label: "Raças Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    breedsNames: option.string.layout({
      label: "Raças Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petBreed: option.string.layout({
      label: "Raça Pet",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ breeds }) => (breeds ? [breeds] : []),
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const specieId = options?.specie ?? "";
        const breeds = await tecpetSdk.breed.list(
          specieId,
          null,
          options.shopId
        );

        if (breeds) {
          const similarBreeds = getSimilarBreeds(options.name, breeds);

          console.log(similarBreeds)
          if (options.breeds) {
            variables.set([{ id: options.breeds, value: similarBreeds }]);
          }

          if (options.breedsIds) {
            variables.set([{ id: options.breedsIds, value: similarBreeds.map(b => b.id) }]);
          }

          if (options.breedsNames) {
            variables.set([{ id: options.breedsNames, value: similarBreeds.map(b => b.name) }]);
          }

          if (similarBreeds.length === 1) {
            variables.set([{ id: options.petBreed, value: similarBreeds[0].id }]);
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
