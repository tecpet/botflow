import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { parseJsonArray } from "../../helpers/utils";
import type { ChainAddress } from "../api/shop/getShopConfigurations";

export const verifySimilarCityOptionSelected = createAction({
  baseOptions,
  name: "Verificar cidade similar selecionada",
  options: option.object({
    similarCities: option.string.layout({
      label: "Cidades similares encontradas",
      isRequired: true,
      helperText: "Cidades semelhantes encontradas na pesquisa",
    }),
    selectedCity: option.string.layout({
      label: "Cidade selecionada",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ selectedCity }) => {
    const variables = [];

    if (selectedCity) variables.push(selectedCity);

    return variables;
  },
});
export const VerifySimilarCityOptionSelectedHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const similarCities = parseJsonArray<ChainAddress>(options.similarCities);

    logHandler("verifySimilarCityOptionSelected", {
      similarCities: summarizeArray(similarCities),
    });

    if (similarCities.length === 1) {
      logHandler("verifySimilarCityOptionSelected", {
        remaining: 1,
        reason: "exatamente uma cidade similar — selecionada automaticamente",
        selectedCity: similarCities[0],
      });
      variables.set([
        { id: options.selectedCity as string, value: similarCities[0] },
      ]);
    } else if (similarCities.length > 1) {
      logHandler("verifySimilarCityOptionSelected", {
        remaining: similarCities.length,
        reason:
          "múltiplas cidades similares — limpando seleção para o cliente escolher",
      });
      variables.set([{ id: options.selectedCity as string, value: "" }]);
    } else {
      logHandler("verifySimilarCityOptionSelected", {
        remaining: 0,
        reason: "nenhuma cidade similar encontrada — nada definido",
      });
    }
  } catch (error) {
    console.error(error);
  }
};
