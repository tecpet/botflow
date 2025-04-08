import {createAction, option} from "@typebot.io/forge";
import {auth} from "../auth";
import {baseOptions} from "../constants";
import {TecpetSDK} from "tecpet-sdk";

export const getClient = createAction({
  auth,
  baseOptions,
  name: "Buscar Cliente pelo Telefone",
  options: option.object({
    phoneNumber: option.string.layout({
      label: "Telefone",
      isRequired: true,
      helperText: "Telefone do cliente",
    }),
    variableIdToSave: option.string.layout({
      label: "Nome do cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({variableIdToSave}) =>
    variableIdToSave ? [variableIdToSave] : [],
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        logs.add({
          status: 'success',
          description: 'Começando',
        });
        const tecpetSdk = new TecpetSDK(credentials.baseUrl, credentials.apiKey);
        const client = await tecpetSdk.client.getByPhone(options.phoneNumber, 1393);
        if (options.variableIdToSave){
          variables.set([{id: options.variableIdToSave, value: `${client.name}`}]);
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
