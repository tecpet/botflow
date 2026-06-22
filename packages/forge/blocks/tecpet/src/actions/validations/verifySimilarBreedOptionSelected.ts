import type { PaBreedResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";

export const verifySimilarBreedOptionSelected = createAction({
  baseOptions,
  name: "Verificar raça similiar selecionada",
  options: option.object({
    similarBreeds: option.string.layout({
      label: "Raças similares encontradas",
      isRequired: true,
      helperText: "Raças semelhantes",
    }),
    petSRD: option.string.layout({
      label: "SRD",
      isRequired: true,
      helperText: "Sem raça definida",
    }),
    petBreed: option.string.layout({
      label: "Raça Pet",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ similarBreeds }) => {
    const variables = [];

    if (similarBreeds) variables.push(similarBreeds);

    return variables;
  },
});
export const VerifySimilarBreedOptionSelectedHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const rawSimilarBreeds = options.similarBreeds
      ? JSON.parse(options.similarBreeds as string)
      : [];

    const petSRD = options.petSRD
      ? JSON.parse(options.petSRD as string)
      : undefined;

    const similarBreeds: PaBreedResponse[] = rawSimilarBreeds.map(
      (breed: PaBreedResponse) =>
        typeof breed === "string" ? JSON.parse(breed) : breed,
    );

    logHandler("verifySimilarBreedOptionSelected", { similarBreeds: summarizeArray(similarBreeds), petSRDId: petSRD?.id ?? null });

    const petSRDIndex = similarBreeds.findIndex(
      (breed) => breed.id === petSRD.id,
    );

    similarBreeds.splice(petSRDIndex, 1);

    if (similarBreeds.length === 1) {
      logHandler("verifySimilarBreedOptionSelected", { remaining: 1, reason: "exatamente uma raça similar (excluindo SRD) — selecionada automaticamente", selectedBreedId: similarBreeds[0]?.id ?? null });
      variables.set([
        { id: options.petBreed as string, value: similarBreeds[0] },
      ]);
    } else if (similarBreeds.length > 1) {
      logHandler("verifySimilarBreedOptionSelected", { remaining: similarBreeds.length, reason: "múltiplas raças similares (excluindo SRD) — limpando seleção para o cliente escolher" });
      variables.set([{ id: options.petBreed as string, value: "" }]);
    } else {
      logHandler("verifySimilarBreedOptionSelected", { remaining: 0, reason: "nenhuma raça similar restante (excluindo SRD) — nada definido" });
    }
  } catch (error) {
    console.error(error);
  }
};
