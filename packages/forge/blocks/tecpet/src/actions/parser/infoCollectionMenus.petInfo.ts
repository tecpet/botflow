import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const parsePetInfo = createAction({
  baseOptions,
  name: "Construir configurações de informações do pet",
  options: option.object({
    selectedMenuConfigurations: option.string.layout({
      label: "Configurações do menu selecionado",
      isRequired: true,
      helperText: "Configurações",
    }),
    petInfoPetNameEnabled: option.string.layout({
      label: "Cadastro de Pet - Nome do pet habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetNameMessage: option.string.layout({
      label: "Cadastro de Pet - Nome do pet mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSpecieEnabled: option.string.layout({
      label: "Cadastro de Pet - Espécie do pet habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSpecieMessage: option.string.layout({
      label: "Cadastro de Pet - Espécie do pet mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetBreedEnabled: option.string.layout({
      label: "Cadastro de Pet - Raça do pet habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetBreedMessage: option.string.layout({
      label: "Cadastro de Pet - Raça do pet mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSizeEnabled: option.string.layout({
      label: "Cadastro de Pet - Porte do pet habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSizeMessage: option.string.layout({
      label: "Cadastro de Pet - Porte do pet mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSizeMode: option.string.layout({
      label: "Cadastro de Pet - Porte do pet modo de exibição",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetFurEnabled: option.string.layout({
      label: "Cadastro de Pet - Pelo do pet habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetFurMessage: option.string.layout({
      label: "Cadastro de Pet - Pelo do pet mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

  }),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const selectedMenuConfig =
          typeof options.selectedMenuConfigurations === 'string'
            ? JSON.parse(options.selectedMenuConfigurations)
            : options.selectedMenuConfigurations as any;

        const infoCollectionMenus = selectedMenuConfig.infoCollectionMenus;
        const petInfo = infoCollectionMenus.petInfo;

        variables.set([{id: options.petInfoPetNameEnabled, value: Boolean(petInfo.petName.enabled)}]);
        variables.set([{id: options.petInfoPetNameMessage, value: petInfo.petName.message ?? ''}]);

        variables.set([{id: options.petInfoPetSpecieEnabled, value: Boolean(petInfo.petSpecie.enabled)}]);
        variables.set([{id: options.petInfoPetSpecieMessage, value: petInfo.petSpecie.message ?? ''}]);

        variables.set([{id: options.petInfoPetBreedEnabled, value: Boolean(petInfo.petBreed.enabled)}]);
        variables.set([{id: options.petInfoPetBreedMessage, value: petInfo.petBreed.message ?? ''}]);

        variables.set([{id: options.petInfoPetSizeEnabled, value: Boolean(petInfo.petSize.enabled)}]);
        variables.set([{id: options.petInfoPetSizeMessage, value: petInfo.petSize.message ?? ''}]);
        variables.set([{id: options.petInfoPetSizeMode, value: petInfo.petSize.sizeDisplayMode ?? ''}]);

        variables.set([{id: options.petInfoPetFurEnabled, value: Boolean(petInfo.petFur.enabled)}]);
        variables.set([{id: options.petInfoPetFurMessage, value: petInfo.petFur.message ?? ''}]);


      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
