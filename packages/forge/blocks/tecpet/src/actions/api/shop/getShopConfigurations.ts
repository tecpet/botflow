import {
  type PaShopConfigurationsResponse,
  type PaShopResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";


export interface ChainAddress {
  cityName: string;
  uf: string;
}

export const getShopConfigurations = createAction({
  auth,
  baseOptions,
  name: "Configurações da Loja",
  options: option.object({
    shopId: option.number.layout({
      label: "ID Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    chargeModeBySizeAndHair: option.string.layout({
      label: "Modo de Cobrança por porte e pelo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chargeModeByBreed: option.string.layout({
      label: "Modo de Cobrança por raça",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chargeMode: option.string.layout({
      label: "Modo de Cobrança",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    variableIdToSaveAll: option.string.layout({
      label: "Salvar configurações",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    shopSegments: option.string.layout({
      label: "Funcionamento dos Segmentos da loja",
      inputType: "variableDropdown",
    }),
    chainShops: option.string.layout({
      label: "Lojas da rede",
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
    chainAddresses: option.string.layout({
      label: "Endereços da rede",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    chargeMode,
    variableIdToSaveAll,
    chargeModeBySizeAndHair,
    chargeModeByBreed,
    shopSegments,
    chainShops,
    chainCities,
    chainUfs,
    chainAddresses,
  }) => {
    const variables: string[] = [];

    if (chargeMode) variables.push(chargeMode);

    if (chargeModeBySizeAndHair) variables.push(chargeModeBySizeAndHair);

    if (chargeModeByBreed) variables.push(chargeModeByBreed);

    if (chargeMode) variables.push(chargeMode);

    if (variableIdToSaveAll) variables.push(variableIdToSaveAll);

    if (shopSegments) variables.push(shopSegments);

    if (chainShops) variables.push(chainShops);

    if (chainCities) variables.push(chainCities);

    if (chainUfs) variables.push(chainUfs);

    if (chainAddresses) variables.push(chainAddresses);

    return variables;
  },
});
export const GetShopConfigurationsHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    if (options.shopId) {
      const tecpetSdk = new TecpetSDK(
        (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
        credentials.apiKey as string,
      );

      const result: PaShopConfigurationsResponse =
        (await tecpetSdk.shop.getConfigurations(
          options.shopId as number,
        )) as PaShopConfigurationsResponse;


      if (result) {
        const chargeMode = result.advancedConfig?.global?.serviceByBreed
          ? "BREED"
          : "SIZE_AND_HAIR";

        const chainShops: Array<PaShopResponse>  = result.chain?.shops ?? [];

        const chainAddresses: Array<ChainAddress> =
          Array.from(
            new Map(
              chainShops
                .filter((shop) => shop.address?.city && shop.address?.uf)
                .map((shop) => [
                  shop.address.city,
                  { cityName: shop.address.city, uf: shop.address.uf },
                ]),
            ).values(),
          );

        if (options.chainShops) {
          variables.set([{ id: options.chainShops, value: chainShops }]);
        }

        if (options.chainCities) {
          variables.set([
            {
              id: options.chainCities,
              value: chainAddresses.map((chainAddress) => chainAddress.cityName),
            },
          ]);
        }

        if (options.chainUfs) {
          variables.set([
            {
              id: options.chainUfs,
              value: chainAddresses.map((chainAddress) => chainAddress.uf),
            },
          ]);
        }

        if (options.chainAddresses) {
          variables.set([
            {
              id: options.chainAddresses,
              value: chainAddresses
            },
          ]);
        }
        if (options.chargeModeBySizeAndHair) {
          variables.set([
            { id: options.chargeModeBySizeAndHair, value: "SIZE_AND_HAIR" },
          ]);
        }
        if(options.shopSegments) {
          variables.set([
            { id: options.shopSegments, value: result.segments },
          ]);
        }
        if (options.chargeModeByBreed) {
          variables.set([{ id: options.chargeModeByBreed, value: "BREED" }]);
        }
        if (options.chargeMode) {
          variables.set([{ id: options.chargeMode, value: chargeMode }]);
        }
        if (options.variableIdToSaveAll) {
          variables.set([{ id: options.variableIdToSaveAll, value: result }]);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};
