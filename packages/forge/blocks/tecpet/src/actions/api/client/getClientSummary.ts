import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

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
  getSetVariableIds: ({client}) => (client ? [client] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        if (!options.clientId || !options.shopId) {
          return;
        }
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const response = await tecpetSdk.client.summary(
          options.clientId,
          options.shopId,
        );

        if (response && options.client) {
          variables.set([{id: options.client, value: response}]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
