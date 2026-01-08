import type { PaCreatePetInput } from "@tec.pet/tecpet-sdk";
import {
  type BillingItemType,
  type GenderType,
  type PaPetResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const createPet = createAction({
  auth,
  baseOptions,
  name: "Criar novo Pet",
  options: option.object({
    clientId: option.number.layout({
      label: "Cliente",
      isRequired: true,
      helperText: "Id do cliente",
    }),
    name: option.string.layout({
      label: "Nome",
      defaultValue: "",
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
  getSetVariableIds: ({ pet, petId, petName }) => {
    const variables = [];

    if (pet) variables.push(pet);
    if (petId) variables.push(petId);
    if (petName) variables.push(petName);

    return variables;
  },
});
export const CreatePetHandler = async ({
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
          credentials.apiKey as string,
        );

        const petInput: PaCreatePetInput = {
          clientId: Number(options?.clientId),
          name: options?.name as string,
          specieId: options?.specieId ?? "",
          breedId: Number(options?.breedId),
          genre: (options?.gender ?? "MALE") as GenderType,
          size: options?.size as BillingItemType,
          hair: options?.hair as BillingItemType,
        };

        const pet: PaPetResponse = (await tecpetSdk.pet.create(
          petInput,
        )) as PaPetResponse;

        if (pet) {
          variables.set([{ id: options.pet as string, value: pet }]);
          variables.set([{ id: options.petId as string, value: pet.id }]);
          variables.set([{ id: options.petName as string, value: pet.name }]);
        }
      } catch (error) {
        console.error(error);
      }
};
