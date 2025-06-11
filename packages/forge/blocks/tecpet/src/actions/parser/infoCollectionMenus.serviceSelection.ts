import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

export const parseServiceSelection = createAction({
  baseOptions,
  name: "Construir configurações de seleção de serviço",
  options: option.object({
    selectedMenuConfigurations: option.string.layout({
      label: "Configurações do menu selecionado",
      isRequired: true,
      helperText: "Configurações",
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
  }),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const selectedMenuConfig =
          typeof options.selectedMenuConfigurations === 'string'
            ? JSON.parse(options.selectedMenuConfigurations)
            : options.selectedMenuConfigurations as any;

        const infoCollectionMenus = selectedMenuConfig.infoCollectionMenus;
        const serviceSelection = infoCollectionMenus.serviceSelection;

        console.log(serviceSelection);
        variables.set([{id: options.serviceSelectionEnabled, value: Boolean(serviceSelection.service.enabled)}]);
        variables.set([{id: options.serviceSelectionMessage, value: serviceSelection.service.message ?? ''}]);

        variables.set([{
          id: options.serviceSelectionValueMode,
          value: serviceSelection.showServiceValues.priceDisplayMode
        }]);

        variables.set([{
          id: options.additionalSelectionEnabled,
          value: Boolean(serviceSelection.serviceAddons.enabled)
        }]);
        variables.set([{id: options.additionalSelectionMessage, value: serviceSelection.serviceAddons.message ?? ''}]);

        variables.set([{
          id: options.professionalSelectionEnabled,
          value: Boolean(serviceSelection.serviceProfessionalChoice.enabled)
        }]);
        variables.set([{
          id: options.professionalSelectionMessage,
          value: serviceSelection.serviceProfessionalChoice.message ?? ''
        }]);

        variables.set([{
          id: options.promotionSelectionEnabled,
          value: Boolean(serviceSelection.showServicePromotions.enabled)
        }]);


      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
