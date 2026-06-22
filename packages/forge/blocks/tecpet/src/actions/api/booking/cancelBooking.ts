import {
  BookingStatus,
  type PaGetBookingResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler } from "../../../helpers/logger";

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
  credentials,
  options,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const rawBooking = options.booking;

    const selectedBooking: PaGetBookingResponse = JSON.parse(
      rawBooking as string,
    );

    logHandler("cancelBooking", { shopId: options.shopId as number, bookingId: selectedBooking?.id, newStatus: BookingStatus.REMOVED });

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
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
