import type { GetChatbotFormattedMessagesInput } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getFormattedMessages = createAction({
  auth,
  baseOptions,
  name: "Formatar mensagem",
  options: option.object({
    shopId: option.number.layout({
      label: "ID Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    message: option.string.layout({
      label: "Mensagem a ser subsituida",
      isRequired: true,
      helperText: "Id da loja",
    }),
    clientId: option.number.layout({
      label: "ID do cliente",
      isRequired: false,
      helperText: "Id do cliente",
    }),
    petId: option.number.layout({
      label: "ID do pet",
      isRequired: false,
      helperText: "Id do pet",
    }),
    invoiceId: option.number.layout({
      label: "ID da fatura",
      isRequired: false,
      helperText: "Id da fatura",
    }),
    serviceId: option.number.layout({
      label: "ID do serviço",
      isRequired: false,
      helperText: "Id do serviço",
    }),
    bookingId: option.number.layout({
      label: "ID do agendamento",
      isRequired: false,
      helperText: "Id do agendamento",
    }),
    updatedMessage: option.string.layout({
      label: "Mensagem com as tags subsituidas",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ updatedMessage }) => {
    const variables = [];
    if (updatedMessage) variables.push(updatedMessage);
    return variables;
  },
});
export const GetFormattedMessagesHandler = async ({
  credentials, options, variables
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
          credentials.apiKey as string,
        );
        const body: GetChatbotFormattedMessagesInput = {
          ids: {
            clientId: options.clientId as number,
            petId: options.petId as number,
            invoiceId: options.invoiceId as number,
            serviceId: options.serviceId as number,
            bookingId: options.bookingId as number,
          },
          messages: [{ text: (options.message as string) ?? "" }],
        };
        const result = await tecpetSdk.chatbot.getFormattedMessage(
          body,
          options.shopId as number,
        );
        if (result && result.length > 0) {
          variables.set([
            { id: options.updatedMessage as string, value: result[0].message },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
};
