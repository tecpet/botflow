import type { PaBreedResponse } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import { getSimilarBreeds, isSrdBreed } from "../../../helpers/utils";

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
  credentials,
  options,
  variables,
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
    const specieId = (options?.specie as string) ?? "";
    const shopId = Number(options.shopId);
    const breedName = (options.name as string) ?? "";

    logHandler("getBreeds", { shopId, specieId, breedName });

    const breeds: PaBreedResponse[] =
      (await tecpetSdk.breed.list(specieId, "", shopId)) ?? [];

    // O SRD só entra na lista quando a espécie tem um único. Com vários (ex.:
    // um por faixa de peso), escolher um seria chutar o porte e o preço; o
    // cliente chega neles digitando "SRD" ou "vira-lata".
    const srdBreeds = breeds.filter((breed) => isSrdBreed(breed.name));
    const petSRD = srdBreeds.length === 1 ? srdBreeds[0] : null;

    const similarBreeds: Partial<PaBreedResponse>[] = getSimilarBreeds(
      breedName,
      breeds,
    );

    logHandler("getBreeds", {
      breeds: summarizeArray(breeds),
      similarBreeds: summarizeArray(similarBreeds),
      srdCount: srdBreeds.length,
      petSRDId: petSRD?.id,
    });

    if (petSRD) {
      similarBreeds.push({
        id: petSRD.id,
        name: "SRD - Sem Raça Definida",
        hair: petSRD.hair,
        size: petSRD.size,
        specie: petSRD.specie,
        specieId: petSRD.specieId,
      });
    }

    setBreedVariables(options, variables, similarBreeds, petSRD);
  } catch (error) {
    console.error(error);
    // Sem as listas o fluxo monta uma escolha sem opções e encerra calado;
    // vazias, ele cai no "não encontrei essa raça" e pede de novo.
    setBreedVariables(options, variables, [], null);
  }
};

// Sempre grava todas as variáveis, mesmo vazias: o fluxo lê o tamanho de
// Racas.Valores e a escolha de raça usa Racas.Nomes/Racas.Valores.
const setBreedVariables = (
  options: Record<string, unknown>,
  variables: any,
  breedOptions: Partial<PaBreedResponse>[],
  petSRD: PaBreedResponse | null,
) => {
  if (options.petSRD) {
    variables.set([{ id: options.petSRD, value: petSRD }]);
  }

  if (options.breeds) {
    variables.set([{ id: options.breeds, value: breedOptions }]);
  }

  if (options.breedValues) {
    variables.set([
      { id: options.breedValues, value: breedOptions.map((b) => b) },
    ]);
  }

  if (options.breedsNames) {
    variables.set([
      {
        id: options.breedsNames,
        value: breedOptions.map((b) => b.name),
      },
    ]);
  }
};
