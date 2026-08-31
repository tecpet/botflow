import { type PaRescheduleBookingInput, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import {
  describeApiError,
  isTecpetApiError,
  TecpetApiError,
} from "../../../helpers/apiErrors";
import {
  formatPtBrList,
  type GroupScheduleItem,
  type GroupTimeOption,
} from "../../../helpers/groupReschedule";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import { safeJsonParse } from "../../../helpers/utils";

const defaultPetPlanBlockedMessage =
  "Esse atendimento faz parte de um plano que não cobre a data escolhida, então o reagendamento precisa ser feito pela nossa equipe 📋";

/**
 * Reagenda todos os pets do bloco escolhido pelo tutor (TP-4108).
 *
 * O `PUT /booking/{id}/reschedule` move UM agendamento para UM `timeId` — não
 * existe fan-out no servidor (TP-4098). Então o loop é aqui, um pet por vez, com
 * o horário que a combinação já definiu para cada um.
 *
 * O handler não decide nada: traduz o resultado de cada pet em variáveis para o
 * fluxo escolher o caminho. Uma falha no meio NÃO interrompe os demais — parar
 * deixaria o mesmo estado parcial, só com menos pets movidos. O que o fluxo
 * precisa saber é quem foi e quem ficou, e é isso que sai daqui.
 */
export const rescheduleGroupBookings = createAction({
  auth,
  baseOptions,
  name: "Reagendar os agendamentos do grupo",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    selectedGroupTimeOption: option.string.layout({
      label: "Opção de horário do grupo selecionada",
      isRequired: true,
      helperText:
        "Opção escolhida pelo tutor (JSON com os itens de cada pet), vinda do Buscar opções de horário para o grupo",
    }),
    petPlanBlockedMessage: option.string.layout({
      label: "Mensagem de plano fora da validade",
      defaultValue: defaultPetPlanBlockedMessage,
      helperText:
        "Mensagem enviada ao cliente quando algum agendamento pertence a um plano que não cobre a data escolhida",
    }),
    rescheduleSuccess: option.string.layout({
      label: "Reagendamento realizado (saída)",
      helperText:
        "Recebe true somente quando a API confirmou o reagendamento de TODOS os pets",
      inputType: "variableDropdown",
    }),
    isPartialReschedule: option.string.layout({
      label: "Reagendamento parcial (saída)",
      helperText:
        "Recebe true quando parte dos pets foi movida e parte falhou — o fluxo precisa avisar o tutor e mandar para o atendente",
      inputType: "variableDropdown",
    }),
    rescheduledCount: option.string.layout({
      label: "Quantidade reagendada (saída)",
      helperText: "Recebe quantos pets foram movidos",
      inputType: "variableDropdown",
    }),
    rescheduledSummary: option.string.layout({
      label: "Resumo do que foi reagendado (saída)",
      helperText: "Recebe uma linha por pet movido: JUDDY 27/08 às 09:30",
      inputType: "variableDropdown",
    }),
    failedPetNames: option.string.layout({
      label: "Pets que não foram reagendados (saída)",
      helperText: "Recebe JIMMY e BIANCA — pronto para a mensagem",
      inputType: "variableDropdown",
    }),
    isRescheduleBlockedByPetPlan: option.string.layout({
      label: "Reagendamento bloqueado pelo plano (saída)",
      helperText:
        "Recebe true quando a API recusou algum pet por causa da validade do plano",
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
    isPartialReschedule,
    rescheduledCount,
    rescheduledSummary,
    failedPetNames,
    isRescheduleBlockedByPetPlan,
    rescheduleBlockedMessage,
  }) => {
    const variables = [];

    if (rescheduleSuccess) variables.push(rescheduleSuccess);
    if (isPartialReschedule) variables.push(isPartialReschedule);
    if (rescheduledCount) variables.push(rescheduledCount);
    if (rescheduledSummary) variables.push(rescheduledSummary);
    if (failedPetNames) variables.push(failedPetNames);
    if (isRescheduleBlockedByPetPlan)
      variables.push(isRescheduleBlockedByPetPlan);
    if (rescheduleBlockedMessage) variables.push(rescheduleBlockedMessage);

    return variables;
  },
});

/**
 * Códigos de validade de plano que o `changeBookingDate` devolve com 403 quando
 * o agendamento nasceu dentro de um pet plan e a data nova cai fora dele
 * (TP-4050). O `availableTimes` não conhece essa regra e oferta os slots
 * normalmente, então a recusa só aparece na confirmação.
 */
const petPlanValidityErrors = [
  TecpetApiError.BOOKING_DATE_AFTER_PET_PLAN_END_DATE,
  TecpetApiError.BOOKING_DATE_BEFORE_PET_PLAN_START_DATE,
  TecpetApiError.PET_PLAN_IS_CANCELED,
];

const parseSelectedOption = (raw: unknown): GroupTimeOption | null => {
  const parsed =
    typeof raw === "string" ? safeJsonParse<unknown>(raw, null) : raw;

  // O Typebot grava a escolha de uma lista como o item ou como array com o item.
  const candidate = Array.isArray(parsed) ? parsed[0] : parsed;

  const groupOption =
    typeof candidate === "string"
      ? safeJsonParse<unknown>(candidate, null)
      : candidate;

  if (!groupOption || typeof groupOption !== "object") return null;

  const items = (groupOption as { items?: unknown }).items;

  if (!Array.isArray(items) || items.length === 0) return null;

  return groupOption as GroupTimeOption;
};

export const RescheduleGroupBookingsHandler = async ({
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
  const setVariable = (optionKey: string, value: unknown) => {
    const variableId = options[optionKey] as string;

    if (variableId) variables.set([{ id: variableId, value }]);
  };

  const setOutcome = ({
    rescheduled,
    failed,
    blockedByPetPlan,
  }: {
    rescheduled: GroupScheduleItem[];
    failed: GroupScheduleItem[];
    blockedByPetPlan: boolean;
  }) => {
    const success = failed.length === 0 && rescheduled.length > 0;

    setVariable("rescheduleSuccess", success);
    setVariable(
      "isPartialReschedule",
      rescheduled.length > 0 && failed.length > 0,
    );
    setVariable("rescheduledCount", rescheduled.length);
    setVariable(
      "rescheduledSummary",
      rescheduled.map(
        (item) => `${item.petName} ${item.dateBR} às ${item.start}`,
      ),
    );
    setVariable(
      "failedPetNames",
      formatPtBrList(failed.map((item) => item.petName)),
    );
    setVariable("isRescheduleBlockedByPetPlan", blockedByPetPlan);
    setVariable(
      "rescheduleBlockedMessage",
      blockedByPetPlan
        ? (options.petPlanBlockedMessage as string) ||
            defaultPetPlanBlockedMessage
        : "",
    );
  };

  try {
    const shopId = Number(options.shopId);

    const selectedOption = parseSelectedOption(options.selectedGroupTimeOption);

    if (!selectedOption) {
      // Sem os itens do bloco não há o que reagendar, e adivinhar um horário
      // seria pior que falhar: o fluxo só confirma quando `rescheduleSuccess`
      // for true.
      logHandler("rescheduleGroupBookings", {
        failed: true,
        reason: "opção de horário do grupo sem itens",
        rawSelectedGroupTimeOption: options.selectedGroupTimeOption,
      });
      logs?.add({
        status: "error",
        description: "Failed to reschedule group bookings",
        details: "Selected group time option has no items",
      });

      setOutcome({ rescheduled: [], failed: [], blockedByPetPlan: false });
      return;
    }

    const items = selectedOption.items.filter(
      (item) => Number(item?.bookingId) > 0 && Boolean(item?.timeId),
    );

    logHandler("rescheduleGroupBookings", {
      shopId,
      optionId: selectedOption.id,
      dateISO: selectedOption.dateISO,
      items: summarizeArray(
        items.map((item) => ({
          bookingId: item.bookingId,
          petName: item.petName,
          timeId: item.timeId,
          start: item.start,
        })),
      ),
    });

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const rescheduled: GroupScheduleItem[] = [];
    const failed: GroupScheduleItem[] = [];
    let blockedByPetPlan = false;

    // Sequencial de propósito: em paralelo os pets do mesmo tutor disputariam a
    // capacidade do dia na própria API, e um deles perderia o slot que a
    // combinação já tinha reservado para ele.
    for (const item of items) {
      const body: PaRescheduleBookingInput = {
        timeId: item.timeId,
        date: item.dateISO,
      };

      try {
        const response = await tecpetSdk.booking.reschedule(
          Number(item.bookingId),
          body,
          shopId,
        );

        if (response?.success) {
          rescheduled.push(item);
        } else {
          failed.push(item);
        }

        logHandler("rescheduleGroupBookings", {
          bookingId: item.bookingId,
          petName: item.petName,
          body,
          success: Boolean(response?.success),
          message: response?.message,
        });
      } catch (error) {
        const itemBlockedByPetPlan = petPlanValidityErrors.some((apiError) =>
          isTecpetApiError(error, apiError),
        );

        blockedByPetPlan = blockedByPetPlan || itemBlockedByPetPlan;
        failed.push(item);

        logHandler("rescheduleGroupBookings", {
          bookingId: item.bookingId,
          petName: item.petName,
          failed: true,
          blockedByPetPlan: itemBlockedByPetPlan,
          error: describeApiError(error),
        });

        if (!itemBlockedByPetPlan) {
          console.error(error);
          logs?.add({
            status: "error",
            description: `Failed to reschedule booking ${item.bookingId}`,
            details: describeApiError(error),
          });
        }
      }
    }

    logHandler("rescheduleGroupBookings", {
      requested: items.length,
      rescheduled: rescheduled.length,
      failed: failed.length,
      failedPetNames: failed.map((item) => item.petName),
      blockedByPetPlan,
    });

    setOutcome({ rescheduled, failed, blockedByPetPlan });
  } catch (error) {
    console.error(error);
    logs?.add({
      status: "error",
      description: "Failed to reschedule group bookings",
      details: describeApiError(error),
    });
    logHandler("rescheduleGroupBookings", {
      handlerFailed: true,
      error: describeApiError(error),
    });

    setOutcome({ rescheduled: [], failed: [], blockedByPetPlan: false });
  }
};
