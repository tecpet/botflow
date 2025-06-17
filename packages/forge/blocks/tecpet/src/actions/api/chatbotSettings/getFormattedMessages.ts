import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";

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
    message: option.number.layout({
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
  getSetVariableIds: ({configurations}) =>
    configurations ? [configurations] : [],
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );
        const body = {
          ids: {
            clientId: options.clientId || null,
            petId: options.petId || null,
            invoiceId: options.invoiceId || null,
            serviceId: options.serviceId || null,
            bookingId: options.bookingId || null,
          },
          messages: [
            {text: options.message}
          ]
        }
        const result = await tecpetSdk.chatbot.getFormattedMessage(
          body,
          options.shopId,
        );

        if (result && result.length > 0) {
          variables.set([{id: options.updatedMessage, value: result[0].message}]);
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
