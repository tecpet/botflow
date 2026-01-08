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
    breedValues: option.string.layout({
      label: "Valores de raça",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    breedsNames: option.string.layout({
      label: "Raças Nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petSRD: option.string.layout({
      label: "SRD - Sem raça definida",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ breeds, breedValues, breedsNames, petSRD }) => {
    const variables = [];

    if (breeds) variables.push(breeds);
    if (breedValues) variables.push(breedValues);
    if (breedsNames) variables.push(breedsNames);
    if (petSRD) variables.push(petSRD);

    return variables;
  },
});
export const GetBreedsHandler = async ({
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
        const specieId = options?.specie ?? "";
        const shopId = Number(options.shopId);
        const breedName = options.name ?? "";
        const breeds: PaBreedResponse[] = await tecpetSdk.breed.list(
          specieId,
          "",
          shopId,
        );

        const petSRD: PaBreedResponse = breeds.find((breed) => {
          if (breed.name.includes("SRD")) return breed;
        }) as PaBreedResponse;

        if (breeds && breeds.length > 0) {
          const similarBreeds: {
            [k: string]: string;
            name: string;
          }[] = getSimilarBreeds(breedName, breeds);

          similarBreeds.push({
            id: petSRD.id.toString(),
            name: "SRD - Sem Raça Definida",
          });

          variables.set([{ id: options.petSRD as string, value: petSRD }]);

          if (options.breeds) {
            variables.set([{ id: options.breeds, value: similarBreeds }]);
          }

          if (options.breedValues) {
            variables.set([
              { id: options.breedValues, value: similarBreeds.map((b) => b) },
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
        }
      } catch (error) {
        console.error(error);
      }
};
