import type { PaEditClientInput } from "@tec.pet/tecpet-sdk";
import { type PaClientResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const editClient = createAction({
  auth,
  baseOptions,
  name: "Editar um cliente",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    clientId: option.number.layout({
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
  getSetVariableIds: ({
    editedClientName,
    editedClientCpf,
    editedClientBirthDate,
  }) => {
    const variables = [];

    if (editedClientName) variables.push(editedClientName);
    if (editedClientCpf) variables.push(editedClientCpf);
    if (editedClientBirthDate) variables.push(editedClientBirthDate);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const body: PaEditClientInput = {
          name: options.clientName ?? "",
          cpf: options.clientCpf ?? "",
          birthDate: options.clientBirthDate ?? "",
        };
        const editedClient: PaClientResponse = await tecpetSdk.client.edit(
          Number(options.clientId),
          body,
          Number(options.shopId),
        );

        if (editedClient) {
          variables.set([
            {
              id: options.editedClientName as string,
              value: editedClient.name,
            },
          ]);
          variables.set([
            { id: options.editedClientCpf as string, value: editedClient.cpf },
          ]);
          variables.set([
            {
              id: options.editedClientBirthDate as string,
              value: editedClient.birthDate,
            },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
