import { type PaClientResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getClient = createAction({
  auth,
  baseOptions,
  name: "Buscar Cliente pelo Telefone",
  options: option.object({
    shopId: option.number.layout({
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
  getSetVariableIds: ({ client }) => {
    const variables = [];

    if (client) variables.push(client);

    return variables;
  },
});
export const GetClientHandler = async ({
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const response: PaClientResponse = await tecpetSdk.client.getByPhone(
          options?.phoneNumber ?? "",
          options.shopId,
        );

        if (response) {
          variables.set([{ id: options.client as string, value: response }]);
        }
      } catch (error) {
        console.error(error);
      }
};
