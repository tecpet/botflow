import type { PaBreedResponse } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
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
  getSetVariableIds: ({ breeds, breedsIds, breedsNames, petBreed }) => {
    const variables = [];

    if (breeds) variables.push(breeds);
    if (breedsIds) variables.push(breedsIds);
    if (breedsNames) variables.push(breedsNames);
    if (petBreed) variables.push(petBreed);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const specieId = options?.specie ?? "";
        const shopId = Number(options.shopId);
        const breedName = options.name ?? "";
        const breeds: PaBreedResponse[] = (await tecpetSdk.breed.list(
          specieId,
          "",
          shopId,
        )) as PaBreedResponse[];

        if (breeds && breeds.length > 0) {
          const similarBreeds = getSimilarBreeds(breedName, breeds);

          if (options.breeds) {
            variables.set([{ id: options.breeds, value: similarBreeds }]);
          }

          if (options.breedsIds) {
            variables.set([
              { id: options.breedsIds, value: similarBreeds.map((b) => b.id) },
            ]);
          }

          if (options.breedsNames) {
            variables.set([
              {
                id: options.breedsNames,
                value: similarBreeds.map((b) => b.name),
              },
            ]);
          }

          if (similarBreeds.length === 1) {
            variables.set([
              { id: options.petBreed as string, value: similarBreeds[0].id },
            ]);
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
