import type { PaGetBookingResponse, PaPetResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const buildClientBookingsSummary = createAction({
  baseOptions,
  name: "Montar lista de agendamentos do cliente",
  options: option.object({
    pet: option.string.layout({
      label: "Pet do cliente",
      isRequired: true,
    }),
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
});
export const BuildClientBookingsSummaryHandler = async ({
  options, variables
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
      try {
        const rawPet = options.pet as string;
        const rawClientBookings = options.clientBookings;

        const pet: PaPetResponse = JSON.parse(rawPet);

        const clientBookingsParsed: string[] = rawClientBookings
          ? JSON.parse(rawClientBookings as string)
          : null;

        const bookings: Array<
          PaGetBookingResponse & {
            bookingDescription?: string;
            backToMenu?: boolean;
          }
        > = clientBookingsParsed.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );

        const filteredBookings: Array<
          Partial<
            PaGetBookingResponse & {
              bookingDescription?: string;
              backToMenu?: boolean;
            }
          >
        > = bookings.filter(
          (booking) => booking.petId === pet.id && booking.status !== "REMOVED",
        );

        filteredBookings.forEach((booking) => {
          let bookingDescription = "";
          booking.services?.forEach((service, index) => {
            if (index > 0) {
              bookingDescription += " + ";
            }
            bookingDescription += service.name;
          });

          booking["bookingDescription"] = bookingDescription;
        });

        filteredBookings.push({
          backToMenu: true,
          start: "",
          stop: "",
        });

        variables.set([
          {
            id: options.bookingsValue as string,
            value: filteredBookings.map((b) => b),
          },
        ]);
        variables.set([
          {
            id: options.bookingsDescription as string,
            value: filteredBookings.map((b) => b.bookingDescription ?? ""),
          },
        ]);
        variables.set([
          {
            id: options.bookingsName as string,
            value: filteredBookings.map((b) => {
              if (!b.backToMenu) {
                return `${b.start}-${b.stop}`;
              } else {
                return "VOLTAR AO MENU INICIAL";
              }
            }),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
};
