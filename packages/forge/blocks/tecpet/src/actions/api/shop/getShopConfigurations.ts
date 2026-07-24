import {
  type PaShopConfigurationsResponse,
  type PaShopResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";

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
    shopSettings: option.string.layout({
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
    chainAddresses: option.string.layout({
      label: "Endereços da rede",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    chargeMode,
    shopSettings,
    chargeModeBySizeAndHair,
    chargeModeByBreed,
    shopSegments,
    chainShops,
    chainAddresses,
  }) => {
    const variables: string[] = [];

    if (chargeMode) variables.push(chargeMode);

    if (chargeModeBySizeAndHair) variables.push(chargeModeBySizeAndHair);

    if (chargeModeByBreed) variables.push(chargeModeByBreed);

    if (chargeMode) variables.push(chargeMode);

    if (shopSettings) variables.push(shopSettings);

    if (shopSegments) variables.push(shopSegments);

    if (chainShops) variables.push(chainShops);

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
    logHandler("getShopConfigurations", { shopId: options.shopId });
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

        const chainShops: Array<PaShopResponse> = result.chain?.shops ?? [];

        const chainAddresses: Array<ChainAddress> = Array.from(
          new Map(
            chainShops
              .filter((shop) => shop.address?.city && shop.address?.uf)
              .map((shop) => [
                shop.address.city,
                { cityName: shop.address.city, uf: shop.address.uf },
              ]),
          ).values(),
        );

        logHandler("getShopConfigurations", {
          chargeMode,
          serviceByBreed: result.advancedConfig?.global?.serviceByBreed,
          chainShops: summarizeArray(chainShops.map((s) => s.id)),
          chainAddresses: summarizeArray(chainAddresses),
          segmentsCount: result.segments?.length,
        });

        if (options.chainShops) {
          variables.set([{ id: options.chainShops, value: chainShops }]);
        }

        if (options.chainAddresses) {
          variables.set([
            {
              id: options.chainAddresses,
              value: chainAddresses,
            },
          ]);
        }
        if (options.chargeModeBySizeAndHair) {
          variables.set([
            { id: options.chargeModeBySizeAndHair, value: "SIZE_AND_HAIR" },
          ]);
        }
        if (options.shopSegments) {
          variables.set([{ id: options.shopSegments, value: result.segments }]);
        }
        if (options.chargeModeByBreed) {
          variables.set([{ id: options.chargeModeByBreed, value: "BREED" }]);
        }
        if (options.chargeMode) {
          variables.set([{ id: options.chargeMode, value: chargeMode }]);
        }
        if (options.shopSettings) {
          variables.set([{ id: options.shopSettings, value: result }]);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};
