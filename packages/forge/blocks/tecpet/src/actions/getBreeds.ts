import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import { auth } from "../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../constants";
import { getSimilarBreeds } from "../helpers/utils";

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
  }),
  getSetVariableIds: ({ breeds }) => (breeds ? [breeds] : []),
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const specie = options?.specie ?? "";
        const name = options?.name ?? "";
        const breeds = await tecpetSdk.breed.getBySpecieAndName(
          specie,
          name,
          options.shopId,
        );
        logs.add({
          status: "success",
          description: JSON.stringify(breeds),
        });
        if (breeds) {
          if (options.breeds) {
            const similarBreeds = getSimilarBreeds(breeds, name);
            variables.set([{ id: options.breeds, value: similarBreeds }]);
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
