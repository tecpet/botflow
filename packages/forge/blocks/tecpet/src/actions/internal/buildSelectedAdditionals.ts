import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export interface IAdditionals {
  id: string;
  name: string;
  description: string;
}

export const buildSelectedAdditionals = createAction({
  baseOptions,
  name: "Construir array de adicionais selecionados",
  options: option.object({
    selectedAdditional: option.number.layout({
      label: "Adicional selecionado",
      isRequired: true,
      helperText: "Adicional selecionado",
    }),
    additionalArray: option.string.layout({
      label: "Array de adicionais",
      isRequired: true,
      helperText: "Array de adicionais",
    }),
    selectedAdditionalsArray: option.string.layout({
      label: "Array de adicionais selecionados",
      isRequired: true,
      helperText: "Array de adicionais selecionados",
    }),
    updateSelectedAdditionalsArray: option.string.layout({
      label: "Array de adicionais selecionados",
      placeholder: "Selecione uma váriavel",
      inputType: "variableDropdown",
      isRequired: true,
      helperText: "Array de adicionais selecionados",
    }),
    updatedAdditionalOptions: option.string.layout({
      label: "Array de adicionais atualizado",
      isRequired: true,
      placeholder: "Selecione uma váriavel",
      inputType: "variableDropdown",
      helperText: "Array de adicionais atualizado",
    }),
    updatedAdditionalOptionsIds: option.string.layout({
      label: "Ids de adicionais atualizados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    updatedAdditionalOptionsNames: option.string.layout({
      label: "Nomes de adicionais atualizados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    updatedAdditionalOptionsDescriptions: option.string.layout({
      label: "Descrições de adicionais atualizados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    updateSelectedAdditionalsArray,
    updatedAdditionalOptions,
    updatedAdditionalOptionsDescriptions,
    updatedAdditionalOptionsIds,
    updatedAdditionalOptionsNames,
  }) => {
    const variables = [];

    if (updateSelectedAdditionalsArray)
      variables.push(updateSelectedAdditionalsArray);
    if (updatedAdditionalOptions) variables.push(updatedAdditionalOptions);
    if (updatedAdditionalOptionsDescriptions)
      variables.push(updatedAdditionalOptionsDescriptions);
    if (updatedAdditionalOptionsIds)
      variables.push(updatedAdditionalOptionsIds);
    if (updatedAdditionalOptionsNames)
      variables.push(updatedAdditionalOptionsNames);

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        const selectedAdditionalId: number = Number(options.selectedAdditional);

        const loadAdditionals: IAdditionals[] = JSON.parse(
          options.additionalArray ?? "[]",
        );

        const additionals = loadAdditionals.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );

        const selectedAdditionals = JSON.parse(
          options.selectedAdditionalsArray ?? "[]",
        );

        selectedAdditionals.push(selectedAdditionalId);

        const updatedAdditionalArray = additionals.filter(
          (item) => item.id !== selectedAdditionalId,
        );

        variables.set([
          {
            id: options.updateSelectedAdditionalsArray as string,
            value: selectedAdditionals,
          },
        ]);
        variables.set([
          {
            id: options.updatedAdditionalOptions as string,
            value: updatedAdditionalArray,
          },
        ]);
        variables.set([
          {
            id: options.updatedAdditionalOptionsIds as string,
            value: updatedAdditionalArray.map((s) => s.id),
          },
        ]);
        variables.set([
          {
            id: options.updatedAdditionalOptionsNames as string,
            value: updatedAdditionalArray.map((s) => s.name),
          },
        ]);
        variables.set([
          {
            id: options.updatedAdditionalOptionsDescriptions as string,
            value: updatedAdditionalArray.map((s) => s.description),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
