import {
  BookingStatus,
  type PaGetBookingResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { isTecpetApiError, TecpetApiError } from "../../../helpers/apiErrors";
import { logHandler } from "../../../helpers/logger";

const defaultPaidCannotCancelMessage =
  "Esse atendimento já está pago, então o cancelamento não pode ser feito por aqui 💳";

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
    paidCannotCancelMessage: option.string.layout({
      label: "Mensagem de agendamento pago",
      defaultValue: defaultPaidCannotCancelMessage,
      helperText:
        "Mensagem enviada ao cliente quando o agendamento já está pago e o cancelamento precisa ir para o atendente",
    }),
    cancelSuccess: option.string.layout({
      label: "Cancelamento realizado",
      helperText: "Recebe true somente quando a API confirmou o cancelamento",
      inputType: "variableDropdown",
    }),
    isCancelBlockedByPayment: option.string.layout({
      label: "Cancelamento bloqueado por pagamento",
      helperText:
        "Recebe true quando a API recusou o cancelamento porque o agendamento está pago",
      inputType: "variableDropdown",
    }),
    cancelBlockedMessage: option.string.layout({
      label: "Mensagem de cancelamento bloqueado (saída)",
      helperText:
        "Recebe a mensagem a ser exibida quando o cancelamento é bloqueado",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    booking,
    cancelSuccess,
    isCancelBlockedByPayment,
    cancelBlockedMessage,
  }) => {
    const variables = [];

    if (booking) variables.push(booking);
    if (cancelSuccess) variables.push(cancelSuccess);
    if (isCancelBlockedByPayment) variables.push(isCancelBlockedByPayment);
    if (cancelBlockedMessage) variables.push(cancelBlockedMessage);

    return variables;
  },
});

/**
 * O cancelamento de um agendamento já pago é recusado pelo servidor com 403 e o
 * código BOOKING_IS_PAID_AND_CANNOT_BE_CANCELED (TP-3778) — a regra também
 * depende do `canCancelIfPaid` da loja, por isso o fluxo não pode decidir isso
 * pelo `invoice.paidValue` que ele já tem em mãos: quem sabe as duas metades da
 * regra é a API. O handler só traduz a resposta em variáveis para o fluxo
 * escolher o caminho (sucesso, bloqueado por pagamento, ou erro genérico).
 */
export const CancelBookingHandler = async ({
  credentials,
  options,
  variables,
  logs,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs?: LogsStore;
}) => {
  const setOutcome = ({
    success,
    blockedByPayment,
    message,
  }: {
    success: boolean;
    blockedByPayment: boolean;
    message: string;
  }) => {
    if (options.cancelSuccess) {
      variables.set([{ id: options.cancelSuccess as string, value: success }]);
    }

    if (options.isCancelBlockedByPayment) {
      variables.set([
        {
          id: options.isCancelBlockedByPayment as string,
          value: blockedByPayment,
        },
      ]);
    }

    if (options.cancelBlockedMessage) {
      variables.set([
        { id: options.cancelBlockedMessage as string, value: message },
      ]);
    }
  };

  try {
    const rawBooking = options.booking;

    const selectedBooking: PaGetBookingResponse = JSON.parse(
      rawBooking as string,
    );

    logHandler("cancelBooking", {
      shopId: options.shopId as number,
      bookingId: selectedBooking?.id,
      newStatus: BookingStatus.REMOVED,
    });

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const response = await tecpetSdk.booking.changeStatus(
      selectedBooking.id,
      { status: BookingStatus.REMOVED },
      options.shopId as number,
    );

    const success = Boolean(response?.success);

    logHandler("cancelBooking", {
      bookingId: selectedBooking?.id,
      success,
      message: response?.message,
    });

    setOutcome({ success, blockedByPayment: false, message: "" });
  } catch (error) {
    const blockedByPayment = isTecpetApiError(
      error,
      TecpetApiError.BOOKING_IS_PAID_AND_CANNOT_BE_CANCELED,
    );

    logHandler("cancelBooking", {
      failed: true,
      blockedByPayment,
      error: error instanceof Error ? error.message : String(error),
    });

    if (!blockedByPayment) {
      console.error(error);
      logs?.add({
        status: "error",
        description: "Failed to cancel booking",
        details: error instanceof Error ? error.message : String(error),
      });
    }

    setOutcome({
      success: false,
      blockedByPayment,
      message: blockedByPayment
        ? (options.paidCannotCancelMessage as string) ||
          defaultPaidCannotCancelMessage
        : "",
    });
  }
};
