import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const parseSelectedFluxInfoCollectionMenus = createAction({
  baseOptions,
  name: "Construir configurações do fluxo - Info Collection",
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
    serviceSelectionEnabled: option.string.layout({
      label: "Serviços do agendamento habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceSelectionMessage: option.string.layout({
      label: "Serviços do agendamento mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceSelectionValueMode: option.string.layout({
      label: "Serviços do agendamento modo exibição de valor",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalSelectionEnabled: option.string.layout({
      label: "Adicionais do agendamento habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalSelectionMessage: option.string.layout({
      label: "Adicionais do agendamento mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    professionalSelectionEnabled: option.string.layout({
      label: "Profissional do agendamento habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    professionalSelectionMessage: option.string.layout({
      label: "Profissional do agendamento mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    promotionSelectionEnabled: option.string.layout({
      label: "Promoções do agendamento habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehavior: option.string.layout({
      label: "Comportamento do seletor de horários",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorMessage: option.string.layout({
      label: "Comportamento do seletor de horários - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorMinAdvanceHours: option.string.layout({
      label: "Comportamento do seletor de horários - Tempo mínimo de antecedência",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorBehavior: option.string.layout({
      label: "Comportamento do seletor de horários - Comportamento",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Comportamento do seletor de horários - Modo de exibição de tempo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringEnabled: option.string.layout({
      label: "Leva e Traz - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringMessage: option.string.layout({
      label: "Leva e Traz - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringMinAdvanceHours: option.string.layout({
      label: "Leva e Traz - Antecedencia",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    guidanceMessage: option.string.layout({
      label: "Orientação - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const setVar = (id: string, value: any) => variables.set([{id, value}]);
        const selectedMenuConfig =
          typeof options.selectedMenuConfigurations === "string"
            ? JSON.parse(options.selectedMenuConfigurations)
            : (options.selectedMenuConfigurations as any);

        const {petInfo, serviceSelection, timeSelection, takeAndBring, guidance} =
          selectedMenuConfig.infoCollectionMenus;

        /* ---- Pet Info ---- */
        [
          [options.petInfoPetNameEnabled, Boolean(petInfo.petName.enabled)],
          [options.petInfoPetNameMessage, petInfo.petName.message ?? ""],
          [options.petInfoPetSpecieEnabled, Boolean(petInfo.petSpecie.enabled)],
          [options.petInfoPetSpecieMessage, petInfo.petSpecie.message ?? ""],
          [options.petInfoPetBreedEnabled, Boolean(petInfo.petBreed.enabled)],
          [options.petInfoPetBreedMessage, petInfo.petBreed.message ?? ""],
          [options.petInfoPetSizeEnabled, Boolean(petInfo.petSize.enabled)],
          [options.petInfoPetSizeMessage, petInfo.petSize.message ?? ""],
          [options.petInfoPetSizeMode, petInfo.petSize.sizeDisplayMode ?? ""],
          [options.petInfoPetFurEnabled, Boolean(petInfo.petFur.enabled)],
          [options.petInfoPetFurMessage, petInfo.petFur.message ?? ""],
        ].forEach(([id, value]) => setVar(id as string, value));

        /* ---- Service Selection ---- */
        [
          [options.serviceSelectionEnabled, Boolean(serviceSelection.service.enabled)],
          [options.serviceSelectionMessage, serviceSelection.service.message ?? ""],
          [options.serviceSelectionValueMode, serviceSelection.showServiceValues.priceDisplayMode],
          [options.additionalSelectionEnabled, Boolean(serviceSelection.serviceAddons.enabled)],
          [options.additionalSelectionMessage, serviceSelection.serviceAddons.message ?? ""],
          [options.professionalSelectionEnabled, Boolean(serviceSelection.serviceProfessionalChoice.enabled)],
          [options.professionalSelectionMessage, serviceSelection.serviceProfessionalChoice.message ?? ""],
          [options.promotionSelectionEnabled, Boolean(serviceSelection.showServicePromotions.enabled)],
        ].forEach(([id, value]) => setVar(id as string, value));

        /* ---- Time Selection ---- */
        [
          [options.timeSelectionBehavior, timeSelection.timeSelectionBehavior],
          [options.timeSelectionBehaviorMessage, timeSelection.timeSelectionBehavior.message],
          [options.timeSelectionBehaviorMinAdvanceHours, timeSelection.timeSelectionBehavior.minAdvanceHours],
          [options.timeSelectionBehaviorBehavior, timeSelection.timeSelectionBehavior.behavior],
          [options.timeSelectionBehaviorTimeDisplayMode, timeSelection.timeSelectionBehavior.timeDisplayMode],
        ].forEach(([id, value]) => setVar(id as string, value));

        const allowTakeAndBring = takeAndBring.allowTakeAndBring;
        [
          [options.takeAndBringEnabled, Boolean(allowTakeAndBring.enabled)],
          [options.takeAndBringMessage, allowTakeAndBring.message ?? ""],
          [options.takeAndBringMinAdvanceHours, allowTakeAndBring.minAdvanceHours ?? ""],
        ].forEach(([id, value]) => setVar(id as string, value));

        setVar(options.guidanceMessage, guidance.guidanceMessage.message ?? "");
      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    }
  },
});
