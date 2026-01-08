import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const verifyAvailableTimesOptionSelected = createAction({
  baseOptions,
  name: "Verificar opção de horario selecionada",
  options: option.object({
    selectedTimeId: option.string.layout({
      label: "Opção de horário selecionada",
      isRequired: true,
      helperText: "Horário selecionado",
    }),
    showOtherDates: option.string.layout({
      label: "Escolher outras datas disponiveis",
      isRequired: true,
      helperText: "Mostrar outras datas",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ selectedTimeId, showOtherDates }) => {
    const variables = [];

    if (selectedTimeId) variables.push(selectedTimeId);
    if (showOtherDates) variables.push(showOtherDates);

    return variables;
  },
});
export const VerifyAvailableTimesOptionSelectedHandler = async ({
  options, variables, logs
}: {
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        let showOtherDates = false;

        const rawSelectedTimeId = options.selectedTimeId;

        const selectedTimeId = rawSelectedTimeId;

        if (selectedTimeId === "OTHER") {
          showOtherDates = true;
        }

        variables.set([
          { id: options.showOtherDates as string, value: showOtherDates },
        ]);
      } catch (error) {
        console.error(error);
      }
};
