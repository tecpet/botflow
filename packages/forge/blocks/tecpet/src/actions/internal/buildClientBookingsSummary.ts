import type { PaPetResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { PaGetBookingResponse } from "../../../../tecpet-sdk/dist/domain/booking/dto/pa.get-booking.dto";
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
  run: {
    server: async ({ options, variables }) => {
      try {
        const rawPet = options.pet as string;
        const rawClientBookings = options.clientBookings;

        console.log(rawClientBookings);

        const pet: PaPetResponse = JSON.parse(rawPet);

        const clientBookingsParsed: string[] = rawClientBookings
          ? JSON.parse(rawClientBookings)
          : null;

        const bookings: Array<PaGetBookingResponse & { bookingName?: string }> =
          clientBookingsParsed.map((item) =>
            typeof item === "string" ? JSON.parse(item) : item,
          );

        const filteredBookings = bookings.filter(
          (booking) => booking.petId === pet.id && booking.status !== "REMOVED",
        );

        filteredBookings.forEach((booking) => {
          let bookingName = "";
          booking.services.forEach((service) => {
            bookingName += " " + service.name;
          });

          booking["bookingName"] = bookingName;
        });

        variables.set([
          {
            id: options.bookingsValue as string,
            value: filteredBookings.map((b) => b),
          },
        ]);
        variables.set([
          {
            id: options.bookingsName as string,
            value: filteredBookings.map((b) => b.bookingName),
          },
        ]);
        variables.set([
          {
            id: options.bookingsDescription as string,
            value: filteredBookings.map((b) => `${b.start}-${b.stop}`),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
