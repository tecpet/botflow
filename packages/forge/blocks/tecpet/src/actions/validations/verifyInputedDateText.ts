import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const verifyInputedDateText = createAction({
  baseOptions,
  name: "Verificar data digitada",
  options: option.object({
    dateInputText: option.string.layout({
      label: "Data digitada",
      isRequired: true,
    }),
    isDateValid: option.string.layout({
      label: "Data válida",
      isRequired: true,
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ dateInputText, isDateValid }) => {
    const variables = [];

    if (dateInputText) variables.push(dateInputText);
    if (isDateValid) variables.push(isDateValid);

    return variables;
  },
});
export const VerifyInputedDateTextHandler = async ({
  options, variables, logs
}: {
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const rawDate = options.dateInputText as string;

        const isDateValid = validarDataReal(rawDate) ? true : false;

        variables.set([
          { id: options.isDateValid as string, value: isDateValid },
        ]);
      } catch (error) {
        console.error(error);
      }
};

export function validarDataReal(date: string) {
  // 1. Verifica o formato com regex
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(date)) return false;

  // 2. Quebra a string em dia, mês e ano
  const [dia, mes, ano] = date.split("/").map(Number);

  // 3. Cria um objeto Date
  const dataObj = new Date(ano, mes - 1, dia);

  // 4. Verifica se o objeto Date bate com os valores
  return (
    dataObj.getFullYear() === ano &&
    dataObj.getMonth() === mes - 1 &&
    dataObj.getDate() === dia
  );
}
