import type { ChatbotActionJson } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

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
      label: "Nome do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetNameMessage: option.string.layout({
      label: "Nome do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSpecieEnabled: option.string.layout({
      label: "Espécie do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSpecieMessage: option.string.layout({
      label: "Espécie do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetBreedEnabled: option.string.layout({
      label: "Raça do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetBreedMessage: option.string.layout({
      label: "Raça do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSizeEnabled: option.string.layout({
      label: "Porte do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSizeMessage: option.string.layout({
      label: "Porte do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetSizeMode: option.string.layout({
      label: "Porte do pet - Modo Exibição",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetFurEnabled: option.string.layout({
      label: "Pelo do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petInfoPetFurMessage: option.string.layout({
      label: "Pelo do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceSelectionMessage: option.string.layout({
      label: "Serviços do agendamento - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceSelectionValueMode: option.string.layout({
      label: "Serviços do agendamento - Modo exibição do valor",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalSelectionEnabled: option.string.layout({
      label: "Adicionais do agendamento - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalSelectionMessage: option.string.layout({
      label: "Adicionais do agendamento - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    professionalSelectionEnabled: option.string.layout({
      label: "Profissional do agendamento - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    professionalSelectionMessage: option.string.layout({
      label: "Profissional do agendamento - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    promotionSelectionEnabled: option.string.layout({
      label: "Promoção do agendamento - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorMessage: option.string.layout({
      label: "Seletor de horários - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorMinAdvanceHours: option.string.layout({
      label: "Seletor de horários - Antecedência",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorBehavior: option.string.layout({
      label: "Seletor de horários - Comportamento",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeSelectionBehaviorTimeDisplayMode: option.string.layout({
      label: "Seletor de horários - Modo exibição dos horarios",
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
      label: "Passar para o atendente - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    confirmClientNameEnabled: option.string.layout({
      label: "Confirmar Nnme do cliente - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    confirmClientNameMessage: option.string.layout({
      label: "Confirmar nome do cliente - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    clientCpfEnabled: option.string.layout({
      label: "CPF do cliente - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    clientCpfMessage: option.string.layout({
      label: "CPF do cliente - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petGenderEnabled: option.string.layout({
      label: "Genero do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petGenderMessage: option.string.layout({
      label: "Genero do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petBirthEnabled: option.string.layout({
      label: "Data nascimento do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petBirthMessage: option.string.layout({
      label: "Data nascimento do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petWeightEnabled: option.string.layout({
      label: "Peso do pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    petWeightMessage: option.string.layout({
      label: "Peso do pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    scheduleToAnotherPetEnabled: option.string.layout({
      label: "Agendar mesmo serviço para outro pet - Habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    scheduleToAnotherPetMessage: option.string.layout({
      label: "Agendar mesmo serviço para outro pet - Mensagem",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    additionalSelectionEnabled,
    additionalSelectionMessage,
    clientCpfEnabled,
    clientCpfMessage,
    confirmClientNameEnabled,
    confirmClientNameMessage,
    guidanceMessage,
    petBirthEnabled,
    petBirthMessage,
    petGenderEnabled,
    petGenderMessage,
    petInfoPetBreedEnabled,
    petInfoPetBreedMessage,
    petInfoPetFurEnabled,
    petInfoPetFurMessage,
    petInfoPetNameEnabled,
    petInfoPetNameMessage,
    petInfoPetSizeEnabled,
    petInfoPetSizeMessage,
    petInfoPetSizeMode,
    petInfoPetSpecieEnabled,
    petInfoPetSpecieMessage,
    petWeightEnabled,
    petWeightMessage,
    professionalSelectionEnabled,
    professionalSelectionMessage,
    promotionSelectionEnabled,
    selectedMenuConfigurations,
    serviceSelectionMessage,
    serviceSelectionValueMode,
    takeAndBringEnabled,
    takeAndBringMessage,
    takeAndBringMinAdvanceHours,
    timeSelectionBehaviorBehavior,
    timeSelectionBehaviorMessage,
    timeSelectionBehaviorMinAdvanceHours,
    timeSelectionBehaviorTimeDisplayMode,
  }) => {
    const variables = [];

    if (additionalSelectionEnabled) variables.push(additionalSelectionEnabled);
    if (additionalSelectionMessage) variables.push(additionalSelectionMessage);
    if (clientCpfEnabled) variables.push(clientCpfEnabled);
    if (clientCpfMessage) variables.push(clientCpfMessage);
    if (confirmClientNameEnabled) variables.push(confirmClientNameEnabled);
    if (confirmClientNameMessage) variables.push(confirmClientNameMessage);
    if (guidanceMessage) variables.push(guidanceMessage);
    if (petBirthEnabled) variables.push(petBirthEnabled);
    if (petBirthMessage) variables.push(petBirthMessage);
    if (petGenderEnabled) variables.push(petGenderEnabled);
    if (petGenderMessage) variables.push(petGenderMessage);
    if (petInfoPetBreedEnabled) variables.push(petInfoPetBreedEnabled);
    if (petInfoPetBreedMessage) variables.push(petInfoPetBreedMessage);
    if (petInfoPetFurEnabled) variables.push(petInfoPetFurEnabled);
    if (petInfoPetFurMessage) variables.push(petInfoPetFurMessage);
    if (petInfoPetNameEnabled) variables.push(petInfoPetNameEnabled);
    if (petInfoPetNameMessage) variables.push(petInfoPetNameMessage);
    if (petInfoPetSizeEnabled) variables.push(petInfoPetSizeEnabled);
    if (petInfoPetSizeMessage) variables.push(petInfoPetSizeMessage);
    if (petInfoPetSizeMode) variables.push(petInfoPetSizeMode);
    if (petInfoPetSpecieEnabled) variables.push(petInfoPetSpecieEnabled);
    if (petInfoPetSpecieMessage) variables.push(petInfoPetSpecieMessage);
    if (petWeightEnabled) variables.push(petWeightEnabled);
    if (petWeightMessage) variables.push(petWeightMessage);
    if (professionalSelectionEnabled)
      variables.push(professionalSelectionEnabled);
    if (professionalSelectionMessage)
      variables.push(professionalSelectionMessage);
    if (promotionSelectionEnabled) variables.push(promotionSelectionEnabled);
    if (selectedMenuConfigurations) variables.push(selectedMenuConfigurations);
    if (serviceSelectionMessage) variables.push(serviceSelectionMessage);
    if (serviceSelectionValueMode) variables.push(serviceSelectionValueMode);
    if (takeAndBringEnabled) variables.push(takeAndBringEnabled);
    if (takeAndBringMessage) variables.push(takeAndBringMessage);
    if (takeAndBringMinAdvanceHours)
      variables.push(takeAndBringMinAdvanceHours);
    if (timeSelectionBehaviorBehavior)
      variables.push(timeSelectionBehaviorBehavior);
    if (timeSelectionBehaviorMessage)
      variables.push(timeSelectionBehaviorMessage);
    if (timeSelectionBehaviorMinAdvanceHours)
      variables.push(timeSelectionBehaviorMinAdvanceHours);
    if (timeSelectionBehaviorTimeDisplayMode)
      variables.push(timeSelectionBehaviorTimeDisplayMode);

    return variables;
  },
  run: {
    server: async ({ options, variables, logs }) => {
      try {
        const setVar = (id: string, value: any) =>
          variables.set([{ id, value }]);

        const chatbotActionConfig: ChatbotActionJson =
          typeof options.selectedMenuConfigurations === "string"
            ? JSON.parse(options.selectedMenuConfigurations)
            : (options.selectedMenuConfigurations as any);

        const {
          petInfo,
          serviceSelection,
          timeSelection,
          takeAndBring,
          guidance,
          extraInfo,
        } = chatbotActionConfig.infoCollectionMenus;

        /* ---- Pet Info ---- */

        const petInfoVariables = [
          [options.petInfoPetNameEnabled, Boolean(petInfo?.petName.enabled)],
          [options.petInfoPetNameMessage, petInfo?.petName.message ?? ""],
          [
            options.petInfoPetSpecieEnabled,
            Boolean(petInfo?.petSpecie.enabled),
          ],
          [options.petInfoPetSpecieMessage, petInfo?.petSpecie.message ?? ""],
          [options.petInfoPetBreedEnabled, Boolean(petInfo?.petBreed.enabled)],
          [options.petInfoPetBreedMessage, petInfo?.petBreed.message ?? ""],
          [options.petInfoPetSizeEnabled, Boolean(petInfo?.petSize.enabled)],
          [options.petInfoPetSizeMessage, petInfo?.petSize.message ?? ""],
          [options.petInfoPetSizeMode, petInfo?.petSize?.sizeDisplayMode ?? ""],
          [options.petInfoPetFurEnabled, Boolean(petInfo?.petFur.enabled)],
          [options.petInfoPetFurMessage, petInfo?.petFur.message ?? ""],
        ];

        petInfoVariables.forEach(([id, value]) => setVar(id as string, value));

        /* ---- Service Selection ---- */

        const serviceSelectionVariables = [
          [
            options.serviceSelectionMessage,
            serviceSelection?.service.message ?? "",
          ],
          [
            options.serviceSelectionValueMode,
            serviceSelection?.showServiceValues.priceDisplayMode,
          ],
          [
            options.additionalSelectionEnabled,
            Boolean(serviceSelection?.serviceAddons.enabled),
          ],
          [
            options.additionalSelectionMessage,
            serviceSelection?.serviceAddons.message ?? "",
          ],
          [
            options.professionalSelectionEnabled,
            Boolean(serviceSelection?.serviceProfessionalChoice.enabled),
          ],
          [
            options.promotionSelectionEnabled,
            Boolean(serviceSelection?.showServicePromotions.enabled),
          ],
        ];

        serviceSelectionVariables.forEach(([id, value]) =>
          setVar(id as string, value),
        );

        /* ---- Time Selection ---- */
        const timeSelectionVariables = [
          [
            options.timeSelectionBehaviorMessage,
            timeSelection?.timeSelectionBehavior.message,
          ],
          [
            options.timeSelectionBehaviorMinAdvanceHours,
            timeSelection?.timeSelectionBehavior.minAdvanceHours,
          ],
          [
            options.timeSelectionBehaviorBehavior,
            timeSelection?.timeSelectionBehavior.behavior,
          ],
          [
            options.timeSelectionBehaviorTimeDisplayMode,
            timeSelection?.timeSelectionBehavior.timeDisplayMode,
          ],
        ];

        timeSelectionVariables.forEach(([id, value]) =>
          setVar(id as string, value),
        );

        const takeAndBringVariables = [
          [
            options.takeAndBringEnabled,
            Boolean(takeAndBring?.allowTakeAndBring.enabled),
          ],
          [
            options.takeAndBringMessage,
            takeAndBring?.allowTakeAndBring.message ?? "",
          ],
          [
            options.takeAndBringMinAdvanceHours,
            takeAndBring?.allowTakeAndBring.minAdvanceHours ?? "",
          ],
        ];

        takeAndBringVariables.forEach(([id, value]) =>
          setVar(id as string, value),
        );

        setVar(
          options?.guidanceMessage as string,
          guidance?.guidanceMessage?.message ?? "",
        );

        const extraInfoVariables = [
          [
            options.confirmClientNameEnabled,
            Boolean(extraInfo?.confirmClientName.enabled),
          ],
          [
            options.confirmClientNameMessage,
            extraInfo?.confirmClientName.message ?? "",
          ],
          [options.clientCpfEnabled, Boolean(extraInfo?.clientCpf.enabled)],
          [options.clientCpfMessage, extraInfo?.clientCpf.message ?? ""],
          [options.petGenderEnabled, Boolean(extraInfo?.petGender.enabled)],
          [options.petGenderMessage, extraInfo?.petGender.message ?? ""],
          [options.petBirthEnabled, Boolean(extraInfo?.petBirthDate.enabled)],
          [options.petBirthMessage, extraInfo?.petBirthDate.message ?? ""],
          [options.petWeightEnabled, Boolean(extraInfo?.petWeight.enabled)],
          [options.petWeightMessage, extraInfo?.petWeight.message ?? ""],
          [
            options.scheduleToAnotherPetEnabled,
            extraInfo?.scheduleToAnotherPet.enabled ?? "",
          ],
          [
            options.scheduleToAnotherPetMessage,
            extraInfo?.scheduleToAnotherPet.message ?? "",
          ],
        ];

        extraInfoVariables.forEach(([id, value]) =>
          setVar(id as string, value),
        );
      } catch (error) {
        console.error(error);
      }
    },
  },
});
