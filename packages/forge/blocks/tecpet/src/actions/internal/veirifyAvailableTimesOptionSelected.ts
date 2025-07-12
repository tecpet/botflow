import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const verifyAvailableTimesOptionSelected = createAction({
  baseOptions,
  name: "Verificar opção de horario selecionada",
  options: option.object({
    selectedTime: option.string.layout({
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
  getSetVariableIds: ({ selectedTime, showOtherDates }) => {
    const variables = [];

    if (selectedTime) variables.push(selectedTime);
    if (showOtherDates) variables.push(showOtherDates);

    return variables;
  },
  run: {
    server: async ({ options, variables, logs }) => {
      try {
        let showOtherDates = false;

        console.log(options.selectedTime);

        const rawSelectedTime = options.selectedTime;

        const selectedTime = JSON.parse(rawSelectedTime ?? "");

        if (!selectedTime.id) {
          showOtherDates = true;
        }

        variables.set([
          { id: options.showOtherDates as string, value: showOtherDates },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
