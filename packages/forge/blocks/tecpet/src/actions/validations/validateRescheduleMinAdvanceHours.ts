import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { createBookingMinAdvanceHandler } from "../../helpers/bookingMinAdvance";

export const validateRescheduleMinAdvanceHours = createAction({
  baseOptions,
  name: "Verificar antecedência mínima para reagendamento",
  options: option.object({
    booking: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: true,
      helperText:
        "Agendamento selecionado (JSON) — usa data/horário de início para a validação",
    }),
    minRescheduleAdvanceHours: option.string.layout({
      label: "Horas de antecedência mínima para reagendamento",
      isRequired: true,
      helperText:
        "Horas mínimas antes do início do agendamento (0/vazio = sem restrição)",
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: true,
      helperText: "Configurações da loja (usado para ler o fuso horário)",
    }),
    canReschedule: option.string.layout({
      label: "Reagendamento permitido",
      isRequired: true,
      helperText:
        "Recebe true quando o agendamento ainda respeita a antecedência mínima",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ canReschedule }) => {
    const variables = [];

    if (canReschedule) variables.push(canReschedule);

    return variables;
  },
});

export const ValidateRescheduleMinAdvanceHoursHandler =
  createBookingMinAdvanceHandler({
    handlerName: "validateRescheduleMinAdvanceHours",
    minAdvanceHoursOptionKey: "minRescheduleAdvanceHours",
    targetOptionKey: "canReschedule",
  });
