import { type PaRescheduleBookingInput, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { PaGetBookingResponse } from "../../../../../tecpet-sdk/dist/domain/booking/dto/pa.get-booking.dto";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import type { AvailableTimeType } from "../availableTimes/getAvailableTimes";

export const rescheduleBooking = createAction({
  auth,
  baseOptions,
  name: "Reagendar um agendamento",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    booking: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: true,
    }),
    selectedTimeOption: option.string.layout({
      label: "Horário selecionado",
      isRequired: true,
      helperText: "Horário selecionado",
    }),
  }),
  getSetVariableIds: () => {
    const variables = [];

    return [];
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const rawBooking = options.booking;

        const selectedBooking: PaGetBookingResponse = JSON.parse(
          rawBooking as string,
        );

        const rawSelectedTimeOption = options.selectedTimeOption;

        const selectedTimeOption: AvailableTimeType = JSON.parse(
          rawSelectedTimeOption as string,
        );

        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const body: PaRescheduleBookingInput = {
          timeId: selectedTimeOption.id ?? "",
          date: selectedTimeOption.dateISO,
        };

        await tecpetSdk.booking.reschedule(
          selectedBooking.id,
          body,
          Number(options.shopId),
        );
      } catch (error) {
        console.error(error);
      }
    },
  },
});
