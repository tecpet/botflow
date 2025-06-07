import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../constants";

export const getClient = createAction({
  auth,
  baseOptions,
  name: "Buscar Cliente pelo Telefone",
  options: option.object({
    shopId: option.string.layout({
      label: "Id da Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    phoneNumber: option.string.layout({
      label: "Telefone",
      isRequired: true,
      helperText: "Telefone do cliente",
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
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const response = await tecpetSdk.client.getByPhone(
          options?.phoneNumber ?? "",
          options.shopId,
        );

        if (response) {
          if (options.client) {
            variables.set([{id: options.client, value: response}]);
          }
        }
      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
