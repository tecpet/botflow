import { validateCpf } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const verifyInputedCpfText = createAction({
  baseOptions,
  name: "Verificar CPF digitado",
  options: option.object({
    cpfInputText: option.string.layout({
      label: "CPF digitado",
      isRequired: true,
    }),
    isCpfValid: option.string.layout({
      label: "CPF válido",
      isRequired: true,
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ cpfInputText, isCpfValid }) => {
    const variables = [];

    if (cpfInputText) variables.push(cpfInputText);
    if (isCpfValid) variables.push(isCpfValid);

    return variables;
  },
});
export const VerifyInputedCpfTextHandler = async ({
  options, variables, logs
}: {
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const rawCpf = options.cpfInputText as string;

        const isCpfValid = validateCpf(rawCpf);

        variables.set([
          { id: options.isCpfValid as string, value: isCpfValid },
        ]);
      } catch (error) {
        console.error(error);
      }
};
