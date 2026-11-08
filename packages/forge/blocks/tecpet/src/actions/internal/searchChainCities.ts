import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { getSimilarCities, parseJsonArray } from "../../helpers/utils";
import type { ChainAddress } from "../api/shop/getShopConfigurations";

export const searchChainCities = createAction({
  baseOptions,
  name: "Pesquisar cidades da rede",
  options: option.object({
    cityName: option.string.layout({
      label: "Cidade digitada",
      isRequired: true,
      helperText: "Texto digitado pelo cliente com o nome da cidade",
    }),
    chainAddresses: option.string.layout({
      label: "Endereços da rede",
      isRequired: true,
      helperText: "Lista de cidades/UFs da rede (de Configurações da Loja)",
    }),
    similarCities: option.string.layout({
      label: "Cidades similares encontradas",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chainCities: option.string.layout({
      label: "Cidades da rede",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chainUfs: option.string.layout({
      label: "UFs da rede",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ similarCities, chainCities, chainUfs }) => {
    const variables: string[] = [];

    if (similarCities) variables.push(similarCities);

    if (chainCities) variables.push(chainCities);

    if (chainUfs) variables.push(chainUfs);

    return variables;
  },
});
export const SearchChainCitiesHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const chainAddresses = parseJsonArray<ChainAddress>(options.chainAddresses);
    const cityName = (options.cityName as string) ?? "";

    logHandler("searchChainCities", {
      cityName,
      chainAddresses: summarizeArray(chainAddresses),
    });

    if (!chainAddresses.length) return;

    const similarCities = getSimilarCities(cityName, chainAddresses);

    logHandler("searchChainCities", {
      similarCities: summarizeArray(similarCities),
    });

    if (options.similarCities) {
      variables.set([{ id: options.similarCities, value: similarCities }]);
    }

    if (options.chainCities) {
      variables.set([
        {
          id: options.chainCities,
          value: similarCities.map((city) => city.cityName),
        },
      ]);
    }

    if (options.chainUfs) {
      variables.set([
        {
          id: options.chainUfs,
          value: similarCities.map((city) => city.uf),
        },
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};
