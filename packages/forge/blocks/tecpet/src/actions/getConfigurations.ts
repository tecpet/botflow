import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../constants";

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
    petInfo: option.string.layout({
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
          const result = await tecpetSdk.chatbotSettings.getByShop(
            options.shopId,
          );
          if (result) {
            if (options.configurations) {
              variables.set([{id: options.configurations, value: result}]);
            }
            if (options.menu) {
              const menu = result.chatbotActions.filter(action => action.enabled);
              variables.set([{id: options.menu, value: menu}]);

              if (options.menuTitles) {
                const menuTitles = menu.map(m => m.name);
                variables.set([{id: options.menuTitles, value: menuTitles}]);
              }

              if (options.menuIds) {
                const menuIds = menu.map(m => m.id);
                variables.set([{id: options.menuIds, value: menuIds}]);
              }

              if (options.menuDescriptions) {
                const menuDescriptions = menu.map(m => m.description);
                variables.set([{id: options.menuDescriptions, value: menuDescriptions}]);
              }
            }

            if (options.newClientMessage) {
              variables.set([{id: options.newClientMessage, value: result.newClientMessage}]);
            }

            if (options.registeredClientMessage) {
              variables.set([{id: options.registeredClientMessage, value: result.registeredClientMessage}]);
            }
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
