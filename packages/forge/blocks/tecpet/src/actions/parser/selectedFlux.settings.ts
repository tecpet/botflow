import type { ChatbotActionJson } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const parseSelectedFluxSettings = createAction({
  baseOptions,
  name: "Construir configurações gerais do fluxo",
  options: option.object({
    selectedActionMenu: option.string.layout({
      label: "Menu de ação selecionado",
      isRequired: true,
      helperText: "Configurações",
    }),
    fluxId: option.string.layout({
      label: "Fluxo - Id",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxName: option.string.layout({
      label: "Fluxo - Nome",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxType: option.string.layout({
      label: "Fluxo - Tipo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    fluxMode: option.string.layout({
      label: "Fluxo - Modo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    schedulePermission: option.string.layout({
      label: "Fluxo - Quem pode agendar",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    conclusionMessage: option.string.layout({
      label: "Fluxo - Mensagem de Conclusão",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  run: {
    server: async ({ options, variables, logs }) => {
      try {
        const rawSelectedActionMenuConfig = JSON.parse(
          options.selectedActionMenu as string,
        );

        const selectedMenuConfig: ChatbotActionJson =
          typeof rawSelectedActionMenuConfig === "string"
            ? JSON.parse(rawSelectedActionMenuConfig)
            : rawSelectedActionMenuConfig;

        variables.set([
          {
            id: options.fluxId as string,
            value: selectedMenuConfig.chatbotFlux.id ?? "",
          },
        ]);

        variables.set([
          {
            id: options.fluxName as string,
            value: selectedMenuConfig.name ?? "",
          },
        ]);
        variables.set([
          {
            id: options.fluxType as string,
            value: selectedMenuConfig.chatbotFlux.fluxType ?? "",
          },
        ]);
        variables.set([
          {
            id: options.fluxMode as string,
            value: selectedMenuConfig.mode ?? "",
          },
        ]);
        variables.set([
          {
            id: options.schedulePermission as string,
            value: selectedMenuConfig.schedulePermission ?? "",
          },
        ]);
        variables.set([
          {
            id: options.conclusionMessage as string,
            value: selectedMenuConfig.conclusionMessage ?? "",
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
