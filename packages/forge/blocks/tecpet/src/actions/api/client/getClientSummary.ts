import { type PaClientSummaryResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getClientSummary = createAction({
  auth,
  baseOptions,
  name: "Buscar Informações do cliente",
  options: option.object({
    clientId: option.number.layout({
      label: "Id do cliente",
      isRequired: true,
    }),
    shopId: option.number.layout({
      label: "Id da Loja",
      isRequired: true,
    }),
    client: option.string.layout({
      label: "Cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ client }) => {
    const variables = [];

    if (client) variables.push(client);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        if (!options.clientId || !options.shopId) {
          return;
        }
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const response: PaClientSummaryResponse =
          (await tecpetSdk.client.summary(
            options.clientId,
            options.shopId,
          )) as PaClientSummaryResponse;

        if (response && options.client) {
          variables.set([{ id: options.client as string, value: response }]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
