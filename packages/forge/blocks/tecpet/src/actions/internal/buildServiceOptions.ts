import type {
  PaComboPricingResponse,
  PaGetServicePricingResponse,
  PaServiceCategoryResponse,
  PaServicePricingResponse,
  PaSimpleServiceResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { formatAsCurrency, parseJsonArray } from "../../helpers/utils";

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
    recommendedServices: option.string.layout({
      label: "Serviços recomendados",
      isRequired: true,
      helperText: "Serviços recomendados",
    }),
    serviceSelectionValueMode: option.string.layout({
      label: "Modo de exibição de valores",
      isRequired: true,
      helperText: "Modo de exibição de valores",
    }),
    serviceSelectionValueEnabled: option.string.layout({
      label: "Modo de exibição habilitado",
      isRequired: true,
      helperText: "Modo de exibição habilitado",
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
    recommendedServiceOptions: option.string.layout({
      label: "Opções de serviços recomendados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    recommendedServiceOptionsIds: option.string.layout({
      label: "Opções de serviços recomendados ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    recommendedServiceOptionsNames: option.string.layout({
      label: "Opções de serviços recomendados nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    recommendedServiceOptionsDescriptions: option.string.layout({
      label: "Opções de serviços recomendados descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringOptions: option.string.layout({
      label: "Opções de leva e traz",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    takeAndBringOptionsNames: option.string.layout({
      label: "Opções de leva e traz nomes",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    takeAndBringOptionsDescriptions: option.string.layout({
      label: "Opções de leva e traz descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    serviceOptions,
    serviceOptionsDescriptions,
    serviceOptionsIds,
    serviceOptionsNames,
    recommendedServiceOptions,
    recommendedServiceOptionsDescriptions,
    recommendedServiceOptionsIds,
    recommendedServiceOptionsNames,
    additionalOptions,
    additionalOptionsDescriptions,
    additionalOptionsIds,
    additionalOptionsNames,
    takeAndBringOptions,
    takeAndBringOptionsDescriptions,
    takeAndBringOptionsNames,
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
    if (recommendedServiceOptions) variables.push(recommendedServiceOptions);
    if (recommendedServiceOptionsDescriptions)
      variables.push(recommendedServiceOptionsDescriptions);
    if (recommendedServiceOptionsIds)
      variables.push(recommendedServiceOptionsIds);
    if (recommendedServiceOptionsNames)
      variables.push(recommendedServiceOptionsNames);
    if (takeAndBringOptions) variables.push(takeAndBringOptions);
    if (takeAndBringOptionsDescriptions)
      variables.push(takeAndBringOptionsDescriptions);
    if (takeAndBringOptionsNames) variables.push(takeAndBringOptionsNames);

    return variables;
  },
});
export const BuildServiceOptionsHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const setVar = (id: string, value: any) => variables.set([{ id, value }]);

    const serviceSelectionValueEnabled = JSON.parse(
      (options.serviceSelectionValueEnabled as string) ?? "false",
    );

    const serviceSelectionValueMode = options.serviceSelectionValueMode;

    const buildDescription = (entity: any) => {
      const price: string = entity.price ? formatAsCurrency(entity.price) : "";

      const description = entity.description ? entity.description : "";

      if (!serviceSelectionValueEnabled) return description;

      switch (serviceSelectionValueMode) {
        case "SHOW_FROM":
          return `A partir de: R$${price}\n${description}`;
        case "SHOW":
          return `${price}\n${description}`;
        case "HIDE":
          return description;
        default:
          return description;
      }
    };

    const combos = parseJsonArray<PaComboPricingResponse>(options.combos);
    const simpleRecommendedServices = parseJsonArray<PaSimpleServiceResponse>(
      options.recommendedServices,
    );
    const categoriesAndServices = parseJsonArray<PaGetServicePricingResponse>(
      options.categoriesAndServices,
    );

    logHandler("buildServiceOptions", { serviceSelectionValueEnabled, serviceSelectionValueMode, inputCombos: summarizeArray(combos.map((c) => ({ id: c.id, name: c.name }))), inputRecommendedServices: summarizeArray(simpleRecommendedServices.map((s) => ({ id: s.id, name: s.name }))), inputCategories: summarizeArray(categoriesAndServices.map((c) => ({ type: c.type, servicesCount: c.services?.length }))) });

    const serviceOptions: ServiceOptionType[] = [];
    const additionalOptions: ServiceOptionType[] = [];
    const recommendedServiceOptions: ServiceOptionType[] = [];
    const takeAndBringOptions: ServiceOptionType[] = [];

    for (const combo of combos) {
      combo.description = buildDescription(combo);
      serviceOptions.push({
        id: combo.id,
        name: combo.name,
        price: combo.price,
        category: null as any,
        description: combo.description,
        type: "COMBO",
        services: combo.services,
      });
    }

    for (const category of categoriesAndServices) {
      for (const service of category.services) {
        service.description = buildDescription(service);

        if (
          simpleRecommendedServices &&
          simpleRecommendedServices.some((s) => s.id === service.id)
        ) {
          recommendedServiceOptions.push({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description,
            type: "SERVICE",
            services: [],
            category: service.serviceCategory,
          });
        }

        if (category.type === "BATH" || category.type === "CLINIC") {
          serviceOptions.push({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description,
            type: "SERVICE",
            services: [],
            category: service.serviceCategory,
          });
        } else if (category.type === "TAKE_AND_BRING") {
          takeAndBringOptions.push({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description,
            type: "SERVICE",
            services: [],
            category: service.serviceCategory,
          });
        } else {
          additionalOptions.push({
            id: service.id,
            name: service.name,
            price: service.price,
            description: service.description,
            type: "SERVICE",
            services: [],
            category: service.serviceCategory,
          });
        }
      }
    }

    if (recommendedServiceOptions.length > 0) {
      recommendedServiceOptions.push({
        id: -1,
        name: "VER OUTROS SERVIÇOS",
        price: 0,
        description: "",
        type: "SERVICE",
        services: [],
        category: null as any,
      });
    }

    logHandler("buildServiceOptions", { outputServiceOptions: summarizeArray(serviceOptions.map((s) => ({ id: s.id, name: s.name, type: s.type }))), outputAdditionalOptions: summarizeArray(additionalOptions.map((s) => ({ id: s.id, name: s.name }))), outputRecommendedServiceOptions: summarizeArray(recommendedServiceOptions.map((s) => ({ id: s.id, name: s.name }))), outputTakeAndBringOptions: summarizeArray(takeAndBringOptions.map((s) => ({ id: s.id, name: s.name }))) });

    const serviceVariables = [
      [options.serviceOptions, serviceOptions],
      [options.serviceOptionsIds, serviceOptions],
      [options.serviceOptionsNames, serviceOptions.map((s) => s.name)],
      [
        options.serviceOptionsDescriptions,
        serviceOptions.map((s) => s.description),
      ],
    ];

    serviceVariables.forEach(([id, value]) => setVar(id as string, value));

    const additionalOptionVariables = [
      [options.additionalOptions, additionalOptions],
      [options.additionalOptionsIds, additionalOptions],
      [options.additionalOptionsNames, additionalOptions.map((s) => s.name)],
      [
        options.additionalOptionsDescriptions,
        additionalOptions.map((s) => s.description),
      ],
    ];
    additionalOptionVariables.forEach(([id, value]) =>
      setVar(id as string, value),
    );

    const recommendedServiceOptionVariables = [
      [options.recommendedServiceOptions, recommendedServiceOptions],
      [options.recommendedServiceOptionsIds, recommendedServiceOptions],
      [
        options.recommendedServiceOptionsNames,
        recommendedServiceOptions.map((s) => s.name),
      ],
      [
        options.recommendedServiceOptionsDescriptions,
        recommendedServiceOptions.map((s) => s.description),
      ],
    ];

    recommendedServiceOptionVariables.forEach(([id, value]) =>
      setVar(id as string, value),
    );

    const takeAndBringOptionVariables = [
      [options.takeAndBringOptions, takeAndBringOptions],
      [
        options.takeAndBringOptionsNames,
        takeAndBringOptions.map((s) => s.name),
      ],
      [
        options.takeAndBringOptionsDescriptions,
        takeAndBringOptions.map((s) => s.description),
      ],
    ];
    takeAndBringOptionVariables.forEach(([id, value]) =>
      setVar(id as string, value),
    );
  } catch (error) {
    console.error(error);
  }
};
