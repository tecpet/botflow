import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { createBookingMinAdvanceHandler } from "../../helpers/bookingMinAdvance";

export const validateCancelMinAdvanceHours = createAction({
  baseOptions,
  name: "Verificar antecedência mínima para cancelamento",
  options: option.object({
    booking: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: true,
      helperText:
        "Agendamento selecionado (JSON) — usa data/horário de início para a validação",
    }),
    minCancelAdvanceHours: option.string.layout({
      label: "Horas de antecedência mínima para cancelamento",
      isRequired: true,
      helperText:
        "Horas mínimas antes do início do agendamento (0/vazio = sem restrição)",
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: true,
      helperText: "Configurações da loja (usado para ler o fuso horário)",
    }),
    canCancel: option.string.layout({
      label: "Cancelamento permitido",
      isRequired: true,
      helperText:
        "Recebe true quando o agendamento ainda respeita a antecedência mínima",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ canCancel }) => {
    const variables = [];

    if (canCancel) variables.push(canCancel);

    return variables;
  },
});

export const ValidateCancelMinAdvanceHoursHandler =
  createBookingMinAdvanceHandler({
    handlerName: "validateCancelMinAdvanceHours",
    minAdvanceHoursOptionKey: "minCancelAdvanceHours",
    targetOptionKey: "canCancel",
  });
