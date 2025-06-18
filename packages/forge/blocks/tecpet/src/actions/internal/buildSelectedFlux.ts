import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";

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
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const rawMenu = options.menu;
        const selectedId = options.selectedFluxId;

        let menuArray;

        if (typeof rawMenu === 'string') {
          const menuStrings = JSON.parse(rawMenu);
          menuArray = menuStrings.map(item =>
            typeof item === 'string' ? JSON.parse(item) : item
          );
        } else if (Array.isArray(rawMenu)) {
          menuArray = rawMenu.map(item =>
            typeof item === 'string' ? JSON.parse(item) : item
          );
        } else {
          throw new Error('Formato inesperado em "Menu"');
        }

        const selected = menuArray.find(({id}) => id === selectedId);

        variables.set([{id: options.selectedMenuSettings, value: selected}]);

      } catch (error) {
        console.error(error)
      }
    }
  },
});
