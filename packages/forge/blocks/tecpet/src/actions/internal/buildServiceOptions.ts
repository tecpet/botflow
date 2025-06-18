import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../../constants";
import {formatAsCurrency} from "../../helpers/utils";

export const buildServiceOptions = createAction({
  // auth,
  baseOptions,
  name: "Construir opções de serviço",
  options: option.object({
    combos: option.string.layout({
      label: "Combos",
      isRequired: true,
      helperText: "Combos",
    }),
    categoriesAndServices: option.string.layout({
      label: "Categorias com serviços",
      isRequired: true,
      helperText: "Categorias com Serviços",
    }),
    serviceSelectionValueMode: option.string.layout({
      label: "Modo de exibição de valores",
      isRequired: true,
      helperText: "Modo de exibição de valores",
    }),
    serviceOptions: option.string.layout({
      label: "Opções de Serviço",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceOptionsIds: option.string.layout({
      label: "Opções de Serviço Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceOptionsNames: option.string.layout({
      label: "Opções de Serviço nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    serviceOptionsDescriptions: option.string.layout({
      label: "Opções de Serviço descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalOptions: option.string.layout({
      label: "Opções de adicionais",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalOptionsIds: option.string.layout({
      label: "Opções de adicionais ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalOptionsNames: option.string.layout({
      label: "Opções de adicionais nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    additionalOptionsDescriptions: option.string.layout({
      label: "Opções de adicionais descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({options, variables, logs}) => {
      try {
        const buildDescription = (entity) => {
          let finalDescription = '';
          const price = entity.price ? `${formatAsCurrency(entity.price)}\n` : '';
          const description = entity.description ? entity.description : '';
          switch (serviceSelectionValueMode) {
            case 'SHOW_FROM':
              finalDescription = `A partir de: R$${price}${description} `;
              break;
            case  'SHOW':
              finalDescription = `R$${price}${description} `;
              break
            default:
              break
          }
          return finalDescription;
        }
        const combosRaw = typeof options.combos === 'string' ? JSON.parse(options.combos) : options.combos as any;
        const categoriesAndServicesRaw = typeof options.categoriesAndServices === 'string' ? JSON.parse(options.categoriesAndServices) : options.categoriesAndServices as any;
        const combos = combosRaw.map(JSON.parse);
        const categoriesAndServices = categoriesAndServicesRaw.map(JSON.parse);
        const serviceSelectionValueMode = options.serviceSelectionValueMode;
        const serviceOptions = [];
        const additionalOptions = [];
        for (const combo of combos) {
          combo.description = buildDescription(combo);
          serviceOptions.push(combo);
        }

        for (const category of categoriesAndServices) {
          for (const service of category.services) {
            service.description = buildDescription(service);
            category.type === 'ADDITIONAL' ? additionalOptions.push(service) : serviceOptions.push(service);
          }
        }

        variables.set([{id: options.serviceOptions, value: serviceOptions}]);
        variables.set([{id: options.serviceOptionsIds, value: serviceOptions.map(s => s.id)}]);
        variables.set([{id: options.serviceOptionsNames, value: serviceOptions.map(s => s.name)}]);
        variables.set([{id: options.serviceOptionsDescriptions, value: serviceOptions.map(s => s.description)}]);

        variables.set([{id: options.additionalOptions, value: additionalOptions}]);
        variables.set([{id: options.additionalOptionsIds, value: additionalOptions.map(s => s.id)}]);
        variables.set([{id: options.additionalOptionsNames, value: additionalOptions.map(s => s.name)}]);
        variables.set([{
          id: options.additionalOptionsDescriptions,
          value: additionalOptions.map(s => s.description)
        }]);

      } catch (error) {
        console.error(error)
      }
    }
    ,
  },
});
