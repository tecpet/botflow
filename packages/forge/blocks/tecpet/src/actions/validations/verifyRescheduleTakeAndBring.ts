import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { baseOptions } from "../../constants";
import { describeApiError } from "../../helpers/apiErrors";
import { logHandler, summarizeArray } from "../../helpers/logger";
import {
  buildRescheduleTakeAndBringMessage,
  DEFAULT_RESCHEDULE_TAKE_AND_BRING_FAILED_MESSAGE,
  DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE,
  parseObjectList,
  type RescheduleTakeAndBringAction,
  type RescheduleTakeAndBringBooking,
  resolveRescheduleTakeAndBring,
} from "../../helpers/rescheduleTakeAndBring";

export const verifyRescheduleTakeAndBring = createAction({
  baseOptions,
  name: "Verificar leva e traz no reagendamento",
  options: option.object({
    bookings: option.string.layout({
      label: "Agendamento(s) a reagendar",
      isRequired: true,
      helperText:
        "{{Agendamento.Selecionado}} no reagendamento de um pet, ou {{Grupo.Agendamentos}} no reagendamento em grupo",
    }),
    chatbotActions: option.string.layout({
      label: "Ações do chatbot",
      isRequired: true,
      helperText:
        "{{Acoes.Menu.Valores}} — de onde sai o comportamento do leva e traz do segmento de cada agendamento",
    }),
    message: option.string.layout({
      label: "Mensagem de encaminhamento",
      defaultValue: DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE,
      helperText:
        "Enviada quando o leva e traz manda o reagendamento para o atendente. {PET_NAME} vira o nome do pet",
      inputType: "textarea",
    }),
    validationFailedMessage: option.string.layout({
      label: "Mensagem de falha na verificação",
      defaultValue: DEFAULT_RESCHEDULE_TAKE_AND_BRING_FAILED_MESSAGE,
      helperText:
        "Enviada quando não deu para ler o agendamento. Nesse caso o reagendamento vai para o atendente por precaução",
      inputType: "textarea",
    }),
    sendToAttendant: option.string.layout({
      label: "Encaminhar para atendente (saída)",
      isRequired: true,
      helperText:
        "Recebe true quando o reagendamento tem que ir para o atendente por causa do leva e traz",
      inputType: "variableDropdown",
    }),
    attendantMessage: option.string.layout({
      label: "Mensagem para o cliente (saída)",
      isRequired: true,
      helperText:
        "Recebe a mensagem a mostrar antes de encaminhar (vazia quando o reagendamento segue)",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ sendToAttendant, attendantMessage }) => {
    const variables = [];

    if (sendToAttendant) variables.push(sendToAttendant);

    if (attendantMessage) variables.push(attendantMessage);

    return variables;
  },
});

/**
 * As duas saídas são gravadas em toda execução, inclusive na falha. Sem isso,
 * a variável fica com o valor anterior da sessão (o reagendamento em grupo e o
 * de um pet usam as mesmas variáveis) e o fluxo decide pelo resíduo.
 */
export const VerifyRescheduleTakeAndBringHandler = async ({
  options,
  variables,
  logs,
}: {
  options: Record<string, unknown>;
  variables: any;
  logs?: LogsStore;
}) => {
  const setOutcome = ({
    sendToAttendant,
    message,
  }: {
    sendToAttendant: boolean;
    message: string;
  }) => {
    if (options.sendToAttendant)
      variables.set([
        { id: options.sendToAttendant as string, value: sendToAttendant },
      ]);

    if (options.attendantMessage)
      variables.set([
        { id: options.attendantMessage as string, value: message },
      ]);
  };

  const failedMessage =
    (options.validationFailedMessage as string | undefined)?.trim() ||
    DEFAULT_RESCHEDULE_TAKE_AND_BRING_FAILED_MESSAGE;

  try {
    const bookings = parseObjectList<Partial<RescheduleTakeAndBringBooking>>(
      options.bookings,
    );

    const chatbotActions = parseObjectList<
      Partial<RescheduleTakeAndBringAction>
    >(options.chatbotActions);

    const decision = resolveRescheduleTakeAndBring({
      bookings,
      chatbotActions,
    });

    logHandler("verifyRescheduleTakeAndBring", {
      bookings: summarizeArray(
        bookings.map((booking) => ({
          id: booking.id ?? null,
          segmentType: booking.segmentType ?? null,
          hasTakeAndBring: booking.hasTakeAndBring ?? null,
        })),
      ),
      chatbotActions: summarizeArray(
        chatbotActions.map((action) => action.actionType ?? null),
        10,
      ),
      sendToAttendant: decision.sendToAttendant,
      reason: decision.reason,
      checks: decision.checks,
    });

    if (!decision.sendToAttendant) {
      setOutcome({ sendToAttendant: false, message: "" });
      return;
    }

    const message =
      decision.reason === "NO_BOOKING"
        ? failedMessage
        : buildRescheduleTakeAndBringMessage(
            (options.message as string | undefined)?.trim() ||
              DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE,
            decision,
          );

    setOutcome({ sendToAttendant: true, message });
  } catch (error) {
    console.error(error);

    logHandler("verifyRescheduleTakeAndBring", {
      failed: true,
      sendToAttendant: true,
      reason: "verificação não concluída — atendente por precaução",
      error: describeApiError(error),
    });

    logs?.add({
      status: "error",
      description: "Failed to verify take and bring on reschedule",
      details: describeApiError(error),
    });

    setOutcome({ sendToAttendant: true, message: failedMessage });
  }
};
