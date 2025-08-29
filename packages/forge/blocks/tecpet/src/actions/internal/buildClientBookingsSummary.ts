import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const buildClientBookingsSummary = createAction({
  baseOptions,
  name: "Construir agendamentos do cliente",
  options: option.object({
    clientBookings: option.string.layout({
      label: "Agendamentos do cliente",
      isRequired: true,
    }),
    bookingsValue: option.string.layout({
      label: "Agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    bookingsName: option.string.layout({
      label: "Nome dos agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    bookingsDescription: option.string.layout({
      label: "Descrição dos agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ bookingsValue, bookingsName, bookingsDescription }) => {
    const variables = [];

    if (bookingsValue) variables.push(bookingsValue);
    if (bookingsName) variables.push(bookingsName);
    if (bookingsDescription) variables.push(bookingsDescription);

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        null;
      } catch (error) {
        console.error(error);
      }
    },
  },
});
