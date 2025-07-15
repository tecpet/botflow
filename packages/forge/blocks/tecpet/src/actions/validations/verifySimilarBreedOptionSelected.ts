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
    petSRD: option.string.layout({
      label: "SRD - Sem raça definida",
      placeholder: "Selecione",
      helperText: "SRD padrão da loja",
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

        const rawPetSRD = options.petSRD;

        const petSRD = rawPetSRD;

        const rawSelectedBreed = options.selectedBreed;

        const selectedBreed = JSON.parse(rawSelectedBreed as string);

        if (!selectedBreed) {
          showOtherBreeds = true;
        }

        if (showOtherBreeds) {
          variables.set([{ id: options.petBreed as string, value: petSRD }]);
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
