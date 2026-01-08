import {
  BookingStatus,
  type PaGetBookingResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const cancelBooking = createAction({
  auth,
  baseOptions,
  name: "Cancelar um agendamento",
  options: option.object({
    booking: option.string.layout({
      label: "Agendamento selecionado",
      placeholder: "Selecione",
      isRequired: true,
    }),
    shopId: option.number.layout({
      label: "ID da loja",
      placeholder: "ID",
      isRequired: true,
    }),
  }),
  getSetVariableIds: ({ booking }) => {
    const variables = [];

    if (booking) variables.push(booking);

    return variables;
  },
});
export const CancelBookingHandler = async ({
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const rawBooking = options.booking;

        const selectedBooking: PaGetBookingResponse = JSON.parse(
          rawBooking as string,
        );

        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        await tecpetSdk.booking.changeStatus(
          selectedBooking.id,
          { status: BookingStatus.REMOVED },
          options.shopId as number,
        );
      } catch (error) {
        console.error(error);
      }
};
