import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

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
    specieId: option.string.layout({
      label: "Espécie",
      isRequired: true,
      helperText: "Espécie do Pet",
    }),
    breedId: option.string.layout({
      label: "Raça Id",
      isRequired: true,
      helperText: "Id da raça do Pet",
    }),
    gender: option.string.layout({
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
    petId: option.string.layout({
      label: "Pet Id",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petName: option.string.layout({
      label: "Pet Name",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({pet}) => (pet ? [pet] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const petInput = {
          clientId: Number(options?.clientId),
          name: options?.name,
          specieId: options?.specieId,
          breedId: Number(options?.breedId),
          genre: options?.gender ?? "MALE",
          size: options?.size,
          hair: options?.hair,
          birthDate: new Date(options.birthDate) ?? "",
        };
        const pet = await tecpetSdk.pet.create(petInput);
        console.log(pet);
        if (pet) {
          variables.set([{id: options.pet, value: pet}]);
          variables.set([{id: options.petId, value: pet.id}]);
          variables.set([{id: options.petName, value: pet.name}]);
        }
      } catch (error) {
        console.error(error);

      }
    },
  },
});
