import type {
  PaServiceCategoryResponse,
  PaServicePricingResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { formatAsCurrency } from "../../helpers/utils";

export interface ServiceOptionType {
  id: number;
  name: string;
  price: number;
  description: string;
  type: "COMBO" | "SERVICE";
  category: PaServiceCategoryResponse;
  services: PaServicePricingResponse[];
}

export const buildServiceOptions = createAction({
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
  getSetVariableIds: ({
    serviceOptions,
    serviceOptionsDescriptions,
    serviceOptionsIds,
    serviceOptionsNames,
    additionalOptions,
    additionalOptionsDescriptions,
    additionalOptionsIds,
    additionalOptionsNames,
  }) => {
    const variables = [];

    if (serviceOptions) variables.push(serviceOptions);
    if (serviceOptionsDescriptions) variables.push(serviceOptionsDescriptions);
    if (serviceOptionsIds) variables.push(serviceOptionsIds);
    if (serviceOptionsNames) variables.push(serviceOptionsNames);
    if (additionalOptions) variables.push(additionalOptions);
    if (additionalOptionsDescriptions)
      variables.push(additionalOptionsDescriptions);
    if (additionalOptionsIds) variables.push(additionalOptionsIds);
    if (additionalOptionsNames) variables.push(additionalOptionsNames);

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        const buildDescription = (entity: any) => {
          let finalDescription = "";
          const price = entity.price
            ? `${formatAsCurrency(entity.price)}\n`
            : "";

          const description = entity.description ? entity.description : "";
          const priceDescription = price ? `A partir de: R$${price}` : "";

          switch (serviceSelectionValueMode) {
            case "SHOW_FROM":
              finalDescription = `${priceDescription}${description} `;
              break;
            case "SHOW":
              finalDescription = `${priceDescription}${description} `;
              break;
            default:
              break;
          }
          return finalDescription;
        };

        const combosRaw =
          typeof options.combos === "string"
            ? JSON.parse(options.combos)
            : (options.combos as any);
        const categoriesAndServicesRaw =
          typeof options.categoriesAndServices === "string"
            ? JSON.parse(options.categoriesAndServices)
            : (options.categoriesAndServices as any);

        const combos = combosRaw.map(JSON.parse);

        const categoriesAndServices = categoriesAndServicesRaw.map(JSON.parse);

        const serviceSelectionValueMode = options.serviceSelectionValueMode;

        const serviceOptions: ServiceOptionType[] = [];
        const additionalOptions = [];

        for (const combo of combos) {
          combo.description = buildDescription(combo);
          serviceOptions.push({
            ...combo,
            type: "COMBO",
            services: combo.services,
          });
        }

        for (const category of categoriesAndServices) {
          for (const service of category.services) {
            service.description = buildDescription(service);
            category.type === "ADDITIONAL"
              ? additionalOptions.push({
                  ...service,
                  type: "SERVICE",
                  category: service.serviceCategory,
                })
              : serviceOptions.push({
                  ...service,
                  type: "SERVICE",
                  category: service.serviceCategory,
                });
          }
        }

        variables.set([
          { id: options.serviceOptions as string, value: serviceOptions },
        ]);
        variables.set([
          {
            id: options.serviceOptionsIds as string,
            value: serviceOptions.map((s) => s),
          },
        ]);
        variables.set([
          {
            id: options.serviceOptionsNames as string,
            value: serviceOptions.map((s) => s.name),
          },
        ]);
        variables.set([
          {
            id: options.serviceOptionsDescriptions as string,
            value: serviceOptions.map((s) => s.description),
          },
        ]);

        variables.set([
          { id: options.additionalOptions as string, value: additionalOptions },
        ]);
        variables.set([
          {
            id: options.additionalOptionsIds as string,
            value: additionalOptions.map((s) => s.id),
          },
        ]);
        variables.set([
          {
            id: options.additionalOptionsNames as string,
            value: additionalOptions.map((s) => s.name),
          },
        ]);
        variables.set([
          {
            id: options.additionalOptionsDescriptions as string,
            value: additionalOptions.map((s) => s.description),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
