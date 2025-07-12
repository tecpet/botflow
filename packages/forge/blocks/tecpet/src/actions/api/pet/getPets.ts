import { createAction, option } from "@typebot.io/forge";
import { type PaPetResponse, TecpetSDK } from "tecpet-sdk";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getPets = createAction({
  auth,
  baseOptions,
  name: "Buscar Pets do Cliente",
  options: option.object({
    clientId: option.number.layout({
      label: "Cliente",
      isRequired: true,
      helperText: "Id do cliente",
    }),
    pets: option.string.layout({
      label: "Pets",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsIds: option.string.layout({
      label: "Pets Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsNames: option.string.layout({
      label: "Pets Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsDescriptions: option.string.layout({
      label: "Pets Descrição",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ pets, petsIds, petsDescriptions, petsNames }) => {
    const variables = [];

    if (pets) variables.push(pets);
    if (petsIds) variables.push(petsIds);
    if (petsDescriptions) variables.push(petsDescriptions);
    if (petsNames) variables.push(petsNames);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        let pets: Partial<PaPetResponse>[] = (await tecpetSdk.pet.getByClient(
          Number(options?.clientId),
        )) as PaPetResponse[];

        if (pets) {
          if (pets.length > 0) {
            pets.push({ id: "new" as string, name: "Cadastrar novo pet" });
            variables.set([{ id: options.pets as string, value: pets }]);
            const petsIds = pets.map((p) => p.id);
            const petsNames = pets.map((p) => p.name);
            const petsDescriptions = pets.map((p) =>
              p.breedName ? p.breedName : "",
            );

            variables.set([{ id: options.petsIds as string, value: petsIds }]);
            variables.set([
              { id: options.petsNames as string, value: petsNames },
            ]);
            variables.set([
              {
                id: options.petsDescriptions as string,
                value: petsDescriptions,
              },
            ]);
          } else {
            pets = [];
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
