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
    clientSummary: option.string.layout({
      label: "Resumo do cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
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
    clientSummary,
    clientBookingsSummary,
  }) => {
    const variables = [];

    if (clientBookingsSummary) variables.push(clientBookingsSummary);
    if (hasAnyBookings) variables.push(hasAnyBookings);
    if (clientPetsSummary) variables.push(clientPetsSummary);
    if (clientSummary) variables.push(clientSummary);
    if (client) variables.push(client);

    return variables;
  },
});

export const getClientSummaryHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    if (!options.clientId || !options.shopId) {
      return;
    }
    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const response: PaClientSummaryResponse = (await tecpetSdk.client.summary(
      options.clientId as number,
      options.shopId as number,
    )) as PaClientSummaryResponse;

    if (response) {
      if (options.clientSummary) {
        variables.set([
          { id: options.clientSummary as string, value: response },
        ]);
      }
      if (options.client) {
        variables.set([
          { id: options.client as string, value: response.client },
        ]);
      }
      if (options.hasAnyBookings) {
        variables.set([
          {
            id: options.hasAnyBookings as string,
            value: response.hasAnyBooking,
          },
        ]);
      }
      if (options.clientBookingsSummary) {
        variables.set([
          {
            id: options.clientBookingsSummary as string,
            value: response.bookings,
          },
        ]);
      }
      if (options.clientPetsSummary) {
        variables.set([
          {
            id: options.clientPetsSummary as string,
            value: response.pets,
          },
        ]);
      }
    }
  } catch (error) {
    console.error(error);
  }
};
