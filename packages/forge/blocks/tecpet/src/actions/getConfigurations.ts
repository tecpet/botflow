import {createAction, option} from "@typebot.io/forge";
import {auth} from "../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../constants";
import {TecpetSDK} from "tecpet-sdk";
import {defaultChatwootOptions} from "@typebot.io/blocks-integrations/chatwoot/constants";

export const getConfigurations = createAction({
  auth,
  baseOptions,
  name: "Configurações",
  options: option.object({
    shopId: option.number.layout({
      label: "ID Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    configurations: option.string.layout({
      label: "Configurações",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({configurations}) =>
    configurations ? [configurations] : [],
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        if (options.shopId) {
          const tecpetSdk = new TecpetSDK(credentials.baseUrl ?? tecpetDefaultBaseUrl, credentials.apiKey);
          const result = await tecpetSdk.chatbotSettings.getByShop(options.shopId);
          if (result) {
            if (options.configurations){
              variables.set([{id: options.configurations, value: result }]);
            }
          }
        }
      } catch (error) {
        logs.add({
          status: 'error',
          description: JSON.stringify(error),
        });
      }
    },
  },
});
