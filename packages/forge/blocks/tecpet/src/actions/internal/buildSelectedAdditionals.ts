import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const buildSelectedAdditionals = createAction({
  baseOptions,
  name: "Construir array de adicionais selecionados",
  options: option.object({
    selectedAdditional: option.string.layout({
      label: "Adicional selecionado",
      isRequired: true,
      helperText: "Adicional selecionado",
    }),
    currentAdditionalArray: option.string.layout({
      label: "Array de adicionais selecionados",
      isRequired: true,
      helperText: "Array de adicionais selecionados",
    }),
    updatedAdditionalArray: option.string.layout({
      label: "Array de adicionais selecionados atualizado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const rawInput = options.currentAdditionalArray ?? "[]";
        const additionalArray: string[] = typeof rawInput === "string" ? JSON.parse(rawInput) : rawInput;
        const withoutDuplicates = new Set(additionalArray);
        withoutDuplicates.add(options.selectedAdditional);
        const finalArray = [...withoutDuplicates];
        variables.set([{id: options.updatedAdditionalArray, value: finalArray},]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
