import { type PaClientSummaryResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getClientSummary = createAction({
  auth,
  baseOptions,
  name: "Buscar Informações do cliente",
  options: option.object({
    clientId: option.number.layout({
      label: "Id do cliente",
      isRequired: true,
    }),
    shopId: option.number.layout({
      label: "Id da Loja",
      isRequired: true,
    }),
    client: option.string.layout({
      label: "Cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    hasAnyBookings: option.string.layout({
      label: "Cliente tem agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    clientPetsSummary: option.string.layout({
      label: "Resumo de pets do cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    clientBookingsSummary: option.string.layout({
      label: "Resumo de agendamentos do cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    client,
    hasAnyBookings,
    clientPetsSummary,
    clientBookingsSummary,
  }) => {
    const variables = [];

    if (clientBookingsSummary) variables.push(clientBookingsSummary);
    if (hasAnyBookings) variables.push(hasAnyBookings);
    if (clientPetsSummary) variables.push(clientPetsSummary);
    if (client) variables.push(client);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        if (!options.clientId || !options.shopId) {
          return;
        }
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const response: PaClientSummaryResponse =
          (await tecpetSdk.client.summary(
            options.clientId,
            options.shopId,
          )) as PaClientSummaryResponse;

        if (response && options.client) {
          variables.set([
            { id: options.client as string, value: response.client },
          ]);
          variables.set([
            {
              id: options.hasAnyBookings as string,
              value: response.hasAnyBooking,
            },
          ]);
          variables.set([
            {
              id: options.clientBookingsSummary as string,
              value: response.bookings,
            },
          ]);
          variables.set([
            {
              id: options.clientPetsSummary as string,
              value: response.pets,
            },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
