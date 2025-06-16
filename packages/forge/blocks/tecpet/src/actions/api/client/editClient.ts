import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

export const editClient = createAction({
  auth,
  baseOptions,
  name: "Editar um cliente",
  options: option.object({
    shopId: option.string.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    clientId: option.string.layout({
      label: "Id do cliente",
      isRequired: true,
      helperText: "Id do cliente",
    }),
    clientName: option.string.layout({
      label: "Nome do cliente",
      isRequired: true,
      helperText: "Nome do cliente",
    }),
    clientCpf: option.string.layout({
      label: "Cpf do cliente",
      isRequired: true,
      helperText: "Cpf do cliente",
    }),
    clientBirthDate: option.string.layout({
      label: "Nascimento do cliente",
      isRequired: true,
      helperText: "Nascimento do cliente",
    }),
    editedClientName: option.string.layout({
      label: "Nome do cliente editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedClientCpf: option.string.layout({
      label: "Cpf do cliente editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedClientBirthDate: option.string.layout({
      label: "Nascimento do cliente editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        console.log(options.clientName)
        const body = {
          name: options.clientName ? options.clientName : null,
          cpf: options.clientCpf ? options.clientCpf : null,
          birthDate: options.clientBirthDate ? options.clientBirthDate : null,
        }
        const editedClient = await tecpetSdk.client.edit(options.clientId, body, options.shopId);
        console.log(editedClient)
        if (editedClient) {
          variables.set([{id: options.editedClientName, value: editedClient.name}]);
          variables.set([{id: options.editedClientCpf, value: editedClient.cpf}]);
          variables.set([{id: options.editedClientBirthDate, value: editedClient.birthDate}]);
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
