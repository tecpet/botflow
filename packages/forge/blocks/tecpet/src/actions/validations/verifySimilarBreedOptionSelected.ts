import type { PaBreedResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const verifySimilarBreedOptionSelected = createAction({
  baseOptions,
  name: "Verificar raça similiar selecionada",
  options: option.object({
    selectedBreed: option.string.layout({
      label: "Opção de raça selecionada",
      isRequired: true,
      helperText: "Raça selecionado",
    }),
    petBreed: option.string.layout({
      label: "Raça do Pet",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    showOtherBreeds: option.string.layout({
      label: "Escolher outras raças",
      isRequired: true,
      helperText: "Encaminha para escolha de porte e pelo",
      inputType: "variableDropdown",
    }),
    petSize: option.string.layout({
      label: "Porte do Pet",
      isRequired: false,
      helperText: "Define o valor de porte da raça selecionada",
      inputType: "variableDropdown",
    }),
    petHair: option.string.layout({
      label: "Pelo do pet",
      isRequired: false,
      helperText: "Define o valor de pelo da raça selecionada",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ selectedBreed, showOtherBreeds, petBreed }) => {
    const variables = [];

    if (selectedBreed) variables.push(selectedBreed);
    if (showOtherBreeds) variables.push(showOtherBreeds);
    if (petBreed) variables.push(petBreed);

    return variables;
  },
  run: {
    server: async ({ options, variables, logs }) => {
      try {
        let showOtherBreeds = false;

        const rawSelectedBreed = options.selectedBreed;

        const selectedBreed: PaBreedResponse = JSON.parse(
          rawSelectedBreed as string,
        );

        if (!selectedBreed.id) {
          showOtherBreeds = true;
        } else if (selectedBreed.id) {
          variables.set([
            { id: options.petHair as string, value: selectedBreed.hair },
            { id: options.petSize as string, value: selectedBreed.size },
          ]);
        }

        if (showOtherBreeds) {
          variables.set([{ id: options.petBreed as string, value: null }]);
        }

        variables.set([
          { id: options.showOtherBreeds as string, value: showOtherBreeds },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
