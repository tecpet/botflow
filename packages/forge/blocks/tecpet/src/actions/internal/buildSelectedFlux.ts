import { createAction, option } from "@typebot.io/forge";
import type { ChatbotActionJson } from "tecpet-sdk";
import { baseOptions } from "../../constants";

export const buildSelectedFlux = createAction({
  baseOptions,
  name: "Construir fluxo selecionado",
  options: option.object({
    menu: option.string.layout({
      label: "Menu",
      isRequired: true,
      helperText: "Menu",
    }),
    selectedFluxId: option.string.layout({
      label: "Id do fluxo selecionado",
      isRequired: true,
      helperText: "Id do fluxo selecionado",
    }),
    selectedMenuSettings: option.string.layout({
      label: "Configurações do Menu selecionado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ menu, selectedFluxId, selectedMenuSettings }) => {
    const variables = [];
    if (menu) variables.push(menu);

    if (selectedFluxId) variables.push(selectedFluxId);

    if (selectedMenuSettings) variables.push(selectedMenuSettings);

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        const rawMenu = options.menu;
        const selectedId = options.selectedFluxId;

        let menuArray: ChatbotActionJson[] = [];

        const menuStrings: ChatbotActionJson[] = JSON.parse(rawMenu as string);

        menuArray = menuStrings.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );

        const selected = menuArray.find(
          (action: any) => action.id === selectedId,
        );

        variables.set([
          { id: options.selectedMenuSettings as string, value: selected },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
