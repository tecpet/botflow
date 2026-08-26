import {
  type PaGetBookingResponse,
  type PaRescheduleBookingInput,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import {
  describeApiError,
  isTecpetApiError,
  TecpetApiError,
} from "../../../helpers/apiErrors";
import { logHandler } from "../../../helpers/logger";
import type { AvailableTimeType } from "../availableTimes/getAvailableTimes";

const defaultPetPlanBlockedMessage =
  "Esse atendimento faz parte de um plano que não cobre a data escolhida, então o reagendamento precisa ser feito pela nossa equipe 📋";

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
    petPlanBlockedMessage: option.string.layout({
      label: "Mensagem de plano fora da validade",
      defaultValue: defaultPetPlanBlockedMessage,
      helperText:
        "Mensagem enviada ao cliente quando o agendamento pertence a um plano que não cobre a data escolhida",
    }),
    rescheduleSuccess: option.string.layout({
      label: "Reagendamento realizado",
      helperText: "Recebe true somente quando a API confirmou o reagendamento",
      inputType: "variableDropdown",
    }),
    isRescheduleBlockedByPetPlan: option.string.layout({
      label: "Reagendamento bloqueado pelo plano",
      helperText:
        "Recebe true quando a API recusou o reagendamento por causa da validade do plano do pet",
      inputType: "variableDropdown",
    }),
    rescheduleBlockedMessage: option.string.layout({
      label: "Mensagem de reagendamento bloqueado (saída)",
      helperText:
        "Recebe a mensagem a ser exibida quando o reagendamento é bloqueado",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    rescheduleSuccess,
    isRescheduleBlockedByPetPlan,
    rescheduleBlockedMessage,
  }) => {
    const variables = [];

    if (rescheduleSuccess) variables.push(rescheduleSuccess);
    if (isRescheduleBlockedByPetPlan)
      variables.push(isRescheduleBlockedByPetPlan);
    if (rescheduleBlockedMessage) variables.push(rescheduleBlockedMessage);

    return variables;
  },
});

/**
 * Códigos de validade de plano que o `changeBookingDate` do servidor devolve com
 * 403 quando o agendamento nasceu dentro de um pet plan e a data nova cai fora
 * dele (TP-4050). O `availableTimes` não conhece essa regra e oferta os slots
 * normalmente, então a recusa só aparece na confirmação — quem sabe a regra é a
 * API.
 */
const petPlanValidityErrors = [
  TecpetApiError.BOOKING_DATE_AFTER_PET_PLAN_END_DATE,
  TecpetApiError.BOOKING_DATE_BEFORE_PET_PLAN_START_DATE,
  TecpetApiError.PET_PLAN_IS_CANCELED,
];

/**
 * O handler não decide nada: ele traduz a resposta da API em variáveis para o
 * fluxo escolher o caminho (sucesso, bloqueado pelo plano, ou erro genérico).
 * Antes da TP-4050 o catch aqui só fazia `console.error`, sem nenhuma saída
 * observável — qualquer falha da API virava uma falsa "Reagendamento
 * concluído!" para o cliente. O fluxo só pode confirmar quando
 * `rescheduleSuccess` for true.
 */
export const RescheduleBookingHandler = async ({
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
    blockedByPetPlan,
    message,
  }: {
    success: boolean;
    blockedByPetPlan: boolean;
    message: string;
  }) => {
    if (options.rescheduleSuccess) {
      variables.set([
        { id: options.rescheduleSuccess as string, value: success },
      ]);
    }

    if (options.isRescheduleBlockedByPetPlan) {
      variables.set([
        {
          id: options.isRescheduleBlockedByPetPlan as string,
          value: blockedByPetPlan,
        },
      ]);
    }

    if (options.rescheduleBlockedMessage) {
      variables.set([
        { id: options.rescheduleBlockedMessage as string, value: message },
      ]);
    }
  };

  try {
    const rawBooking = options.booking;

    const selectedBooking: PaGetBookingResponse = JSON.parse(
      rawBooking as string,
    );

    const rawSelectedTimeOption = options.selectedTimeOption;

    const selectedTimeOption: AvailableTimeType = JSON.parse(
      rawSelectedTimeOption as string,
    );

    logHandler("rescheduleBooking", {
      shopId: Number(options.shopId),
      bookingId: selectedBooking?.id,
      selectedTimeId: selectedTimeOption?.id,
      date: selectedTimeOption?.dateISO,
    });

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const body: PaRescheduleBookingInput = {
      timeId: selectedTimeOption.id ?? "",
      date: selectedTimeOption.dateISO,
    };

    logHandler("rescheduleBooking", { bookingId: selectedBooking?.id, body });

    const response = await tecpetSdk.booking.reschedule(
      selectedBooking.id,
      body,
      Number(options.shopId),
    );

    const success = Boolean(response?.success);

    logHandler("rescheduleBooking", {
      bookingId: selectedBooking?.id,
      success,
      message: response?.message,
    });

    setOutcome({ success, blockedByPetPlan: false, message: "" });
  } catch (error) {
    const blockedByPetPlan = petPlanValidityErrors.some((apiError) =>
      isTecpetApiError(error, apiError),
    );

    logHandler("rescheduleBooking", {
      failed: true,
      blockedByPetPlan,
      error: describeApiError(error),
    });

    if (!blockedByPetPlan) {
      console.error(error);
      logs?.add({
        status: "error",
        description: "Failed to reschedule booking",
        details: describeApiError(error),
      });
    }

    setOutcome({
      success: false,
      blockedByPetPlan,
      message: blockedByPetPlan
        ? (options.petPlanBlockedMessage as string) ||
          defaultPetPlanBlockedMessage
        : "",
    });
  }
};
