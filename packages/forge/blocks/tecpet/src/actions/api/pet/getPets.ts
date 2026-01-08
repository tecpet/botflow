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
    petsWithBooking: option.string.layout({
      label: "IDS de pet com agendamento",
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
});
export const GetPetsHandler = async ({
  credentials, options, variables
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
      try {
        const scheduleToAnotherPet = JSON.parse(
          options.scheduleToAnotherPet as string,
        );

        const rawPetsWithBooking = options.petsWithBooking;

        const petsWithBooking: string[] | null = rawPetsWithBooking
          ? JSON.parse(rawPetsWithBooking)
          : null;

        const tecpetSdk = new TecpetSDK(
          (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
          credentials.apiKey as string,
        );

        let petsResponse: Partial<PaPetResponse>[] =
          await tecpetSdk.pet.getByClient(Number(options?.clientId));

        if (petsResponse) {
          if (petsResponse.length > 0) {
            if (scheduleToAnotherPet && petsWithBooking) {
              petsWithBooking.forEach((petId) => {
                const petIndex = petsResponse.findIndex(
                  (pet) => pet.id === Number(petId),
                );

                petsResponse.splice(petIndex, 1);
              });
            }

            petsResponse.push({
              id: "",
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
};
