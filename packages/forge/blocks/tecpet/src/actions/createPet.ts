import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import { auth } from "../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../constants";

export const createPet = createAction({
  auth,
  baseOptions,
  name: "Criar novo Pet",
  options: option.object({
    clientId: option.string.layout({
      label: "Cliente",
      isRequired: true,
      helperText: "Id do cliente",
    }),
    name: option.string.layout({
      label: "Nome",
      isRequired: true,
      helperText: "Nome do Pet",
    }),
    specie: option.string.layout({
      label: "Espécie",
      isRequired: true,
      helperText: "Espécie do Pet",
    }),
    breedId: option.string.layout({
      label: "Raça Id",
      isRequired: true,
      helperText: "Id da raça do Pet",
    }),
    genre: option.string.layout({
      label: "Genero Nome",
      isRequired: true,
      helperText: "Genero do Pet",
    }),
    size: option.string.layout({
      label: "Porte do Pet",
      isRequired: true,
      helperText: "Porte do Pet",
    }),
    hair: option.string.layout({
      label: "Pelo do Pet",
      isRequired: true,
      helperText: "Pelo do Pet",
    }),
    birthDate: option.string.layout({
      label: "Aniversário do Pet",
      isRequired: true,
      helperText: "Aniversário do Pet",
    }),
    pet: option.string.layout({
      label: "Pet",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ pet }) => (pet ? [pet] : []),
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const petInput = {
          clientId: Number(options?.clientId),
          name: options?.name,
          specie: options?.specie,
          breedId: options?.breedId ?? 57094,
          genre: options?.genre ?? "MALE",
          size: options?.size,
          hair: options?.hair,
          birthDate: new Date(options.birthDate) ?? "",
        };
        const pet = await tecpetSdk.pet.createPet(petInput);
        if (pet) {
          if (options.pet) {
            variables.set([{ id: options.pet, value: pet }]);
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
