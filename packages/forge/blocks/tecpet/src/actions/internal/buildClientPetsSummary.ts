import type { PaPetResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const buildClientPetsSummary = createAction({
  baseOptions,
  name: "Montar lista de pets com agendamento",
  options: option.object({
    clientPetsSummary: option.string.layout({
      label: "Pets do cliente",
      isRequired: true,
      placeholder: "Selecione",
    }),
    petsValue: option.string.layout({
      label: "Pets",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsName: option.string.layout({
      label: "Pets Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petsDescription: option.string.layout({
      label: "Pets Descrição",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ petsValue, petsName, petsDescription }) => {
    const variables = [];

    if (petsValue) variables.push(petsValue);
    if (petsName) variables.push(petsName);
    if (petsDescription) variables.push(petsDescription);

    return variables;
  },
});
export const BuildClientPetsSummaryHandler = async ({
  options, variables
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
      try {
        const rawClientPetsSummary = options.clientPetsSummary;

        const petParsed: string[] = rawClientPetsSummary
          ? JSON.parse(rawClientPetsSummary)
          : null;
        const pets: PaPetResponse[] = petParsed.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );

        variables.set([
          { id: options.petsValue as string, value: pets.map((p) => p) },
        ]);
        variables.set([
          {
            id: options.petsName as string,
            value: pets.map((p) => p.name),
          },
        ]);
        variables.set([
          {
            id: options.petsDescription as string,
            value: pets.map((p) => (p.breedName ? p.breedName : "")),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
};
