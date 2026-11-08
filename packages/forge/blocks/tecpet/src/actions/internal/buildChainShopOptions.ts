import type { PaShopResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { parseJsonArray } from "../../helpers/utils";
import type { ChainAddress } from "../api/shop/getShopConfigurations";

export const buildChainShopOptions = createAction({
  baseOptions,
  name: "Construir opções de lojas da rede",
  options: option.object({
    chainShops: option.string.layout({
      label: "Lojas da rede",
      isRequired: true,
      helperText: "Lojas da rede",
    }),
    chainAddress: option.string.layout({
      label: "Endereço selecionado",
      isRequired: true,
      helperText: "Endereço selecionado para buscar as lojas da rede",
    }),
    chainShopName: option.string.layout({
      label: "Nomes das lojas da cidade",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chainShopId: option.string.layout({
      label: "Ids das lojas da cidade",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chainShopDescription: option.string.layout({
      label: "Descrições das lojas da cidade",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ chainShopName, chainShopId, chainShopDescription }) => {
    const variables: string[] = [];

    if (chainShopName) variables.push(chainShopName);

    if (chainShopId) variables.push(chainShopId);

    if (chainShopDescription) variables.push(chainShopDescription);

    return variables;
  },
});

const parseChainAddress = (raw: unknown): ChainAddress | null => {
  let value: unknown = raw;

  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object") return null;

  return value as ChainAddress;
};

export const BuildChainShopOptionsHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const chainShops = parseJsonArray<PaShopResponse>(options.chainShops);

    const chainAddress = parseChainAddress(options.chainAddress);

    logHandler("buildChainShopOptions", { inputChainShops: summarizeArray(chainShops.map((s) => ({ id: s.id, name: s.name, city: s.address?.city, uf: s.address?.uf }))), chainAddress: chainAddress ? { cityName: chainAddress.cityName, uf: chainAddress.uf } : null });

    if (!chainAddress) return;

    const filteredShops = chainShops.filter(
      (shop) =>
        shop.address?.city === chainAddress.cityName &&
        shop.address?.uf === chainAddress.uf,
    );

    logHandler("buildChainShopOptions", { outputFilteredShops: summarizeArray(filteredShops.map((s) => ({ id: s.id, name: s.name }))) });

    if (options.chainShopName) {
      variables.set([
        {
          id: options.chainShopName,
          value: filteredShops.map((shop) => shop.name),
        },
      ]);
    }

    if (options.chainShopId) {
      variables.set([
        {
          id: options.chainShopId,
          value: filteredShops.map((shop) => shop.id),
        },
      ]);
    }

    if (options.chainShopDescription) {
      variables.set([
        {
          id: options.chainShopDescription,
          value: filteredShops.map((shop) => {
            const { street, number, zipCode } = shop.address ?? {};

            return `${street ?? ""}, ${number ?? ""} - CEP: ${zipCode ?? ""}`;
          }),
        },
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};
