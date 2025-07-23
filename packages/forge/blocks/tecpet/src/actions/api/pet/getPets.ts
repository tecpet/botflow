import { type PaPetResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getPets = createAction({
  auth,
  baseOptions,
  name: "Buscar Pets do Cliente",
  options: option.object({
    scheduleToAnotherPet: option.string.layout({
      label: "Agendar para outro pet",
    }),
    petId: option.number.layout({
      label: "ID do pet",
    }),
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
  getSetVariableIds: ({ pets, petsDescriptions, petsNames }) => {
    const variables = [];

    if (pets) variables.push(pets);
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

        let petsResponse: Partial<PaPetResponse>[] =
          (await tecpetSdk.pet.getByClient(
            Number(options?.clientId),
          )) as PaPetResponse[];

        if (petsResponse) {
          if (petsResponse.length > 0) {
            petsResponse.push({
              id: "new" as string,
              name: "Cadastrar novo pet",
            });

            variables.set([
              { id: options.pets as string, value: petsResponse.map((p) => p) },
            ]);
            variables.set([
              {
                id: options.petsNames as string,
                value: petsResponse.map((p) => p.name),
              },
            ]);
            variables.set([
              {
                id: options.petsDescriptions as string,
                value: petsResponse.map((p) =>
                  p.breedName ? p.breedName : "",
                ),
              },
            ]);
          } else {
            petsResponse = [];
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
