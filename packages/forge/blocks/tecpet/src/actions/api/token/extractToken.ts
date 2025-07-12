import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import type { PaExtractTokenResponse } from "../../../../../tecpet-sdk/dist/domain/token/dto/pa.extract-token.dto";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const extractToken = createAction({
  auth,
  baseOptions,
  name: "Extrair infos da Loja via token",
  options: option.object({
    token: option.string.layout({
      label: "Token",
      isRequired: true,
      helperText: "Token",
    }),
    shopId: option.string.layout({
      label: "Id da Loja",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    shopName: option.string.layout({
      label: "Nome da loja",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ shopId, shopName }) => {
    const variables: Array<string> = [];
    if (shopId) variables.push(shopId);

    if (shopName) variables.push(shopName);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const result: PaExtractTokenResponse = (await tecpetSdk.token.extract(
          options.token as string,
        )) as PaExtractTokenResponse;

        if (result) {
          const { id, name } = result.shop;
          if (options.shopId) {
            variables.set([{ id: options.shopId, value: id }]);
          }
          if (options.shopName) {
            variables.set([{ id: options.shopName, value: name }]);
          }
        }
      } catch (e) {
        console.log("Could not extract token");
        return;
      }
    },
  },
});
