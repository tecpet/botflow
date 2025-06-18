import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

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
    menu: option.string.layout({
      label: "Menu Inicial",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menuTitles: option.string.layout({
      label: "Menu Inicial - Títulos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menuIds: option.string.layout({
      label: "Menu Inicial - Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menuDescriptions: option.string.layout({
      label: "Menu Inicial - Descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    newClientMessage: option.string.layout({
      label: "Mensagem Inicial para novo cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    registeredClientMessage: option.string.layout({
      label: "Mensagem Inicial para cliente antigo",
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
          const tecpetSdk = new TecpetSDK(
            credentials.baseUrl ?? tecpetDefaultBaseUrl,
            credentials.apiKey,
          );
          const result = await tecpetSdk.chatbot.getByShop(
            options.shopId,
          );
          if (result) {
            const variablesToSet = [
              {id: options.configurations, value: result},
              {id: options.menu, value: result.chatbotActions.filter(a => a.enabled)},
              {id: options.menuTitles, value: result.chatbotActions.filter(a => a.enabled).map(a => a.name)},
              {id: options.menuIds, value: result.chatbotActions.filter(a => a.enabled).map(a => a.id)},
              {
                id: options.menuDescriptions,
                value: result.chatbotActions.filter(a => a.enabled).map(a => a.description)
              },
              {id: options.newClientMessage, value: result.newClientMessage},
              {id: options.registeredClientMessage, value: result.registeredClientMessage}
            ];

            variablesToSet.forEach(({id, value}) => {
              if (id !== undefined) {
                variables.set([{id, value}]);
              }
            });
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
