import type { PaSpecieResponse } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getSpecies = createAction({
  auth,
  baseOptions,
  name: "Buscar Espécies da Loja",
  options: option.object({
    shopId: option.number.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    species: option.string.layout({
      label: "Espécies",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    speciesIds: option.string.layout({
      label: "Espécies Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    speciesNames: option.string.layout({
      label: "Espécies Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ species, speciesIds, speciesNames }) => {
    const variables: string[] = [];

    if (species) variables.push(species);

    if (speciesIds) variables.push(speciesIds);

    if (speciesNames) variables.push(speciesNames);

    return variables;
  },
});
export const GetSpeciesHandler = async ({
  credentials, options, variables
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
          credentials.apiKey as string,
        );
        const species: PaSpecieResponse[] = (await tecpetSdk.specie.list(
          Number(options?.shopId),
        )) as PaSpecieResponse[];
        if (species) {
          variables.set([{ id: options.species as string, value: species }]);
          variables.set([
            {
              id: options.speciesIds as string,
              value: species.map((s) => s.id),
            },
          ]);
          variables.set([
            {
              id: options.speciesNames as string,
              value: species.map((s) => s.name),
            },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
};
