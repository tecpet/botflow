import type {
  PaComboPricingResponse,
  PaGetServicePricingResponse,
  PaServiceCategoryResponse,
  PaServicePricingResponse,
  PaSimpleServiceResponse,
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
      let finalDescription = "";
      const price: string = entity.price
        ? `${formatAsCurrency(entity.price)}\n`
        : "";

      const description = entity.description ? entity.description : "";

      if (serviceSelectionValueEnabled) {
        switch (serviceSelectionValueMode) {
          case "SHOW_FROM":
            finalDescription = `A partir de: R$${price} ${description}`;
            break;
          case "SHOW":
            finalDescription = `${price} ${description}`;
            break;
          case "HIDE":
            finalDescription = description;
            break;
          default:
            break;
        }
      } else {
        finalDescription = description;
      }

      return finalDescription;
    };

    const combosRaw: string[] =
      typeof options.combos === "string"
        ? JSON.parse(options.combos)
        : ((options.combos as any) ?? []);

    const categoriesAndServicesRaw: string[] =
      typeof options.categoriesAndServices === "string"
        ? JSON.parse(options.categoriesAndServices)
        : ((options.categoriesAndServices as any) ?? []);

    const combos: PaComboPricingResponse[] = combosRaw.map((combo) =>
      JSON.parse(combo),
    );

    const recommendedServicesRaw: string[] =
      typeof options.recommendedServices === "string"
        ? JSON.parse(options.recommendedServices)
        : ((options.recommendedServices as any) ?? []);

    const simpleRecommendedServices: PaSimpleServiceResponse[] =
      recommendedServicesRaw.map((service) => JSON.parse(service));

    const categoriesAndServices: PaGetServicePricingResponse[] =
      categoriesAndServicesRaw.map((service) => JSON.parse(service));

    const serviceOptions: ServiceOptionType[] = [];
    const additionalOptions: ServiceOptionType[] = [];
    const recommendedServiceOptions: ServiceOptionType[] = [];

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
        } else if (category.type !== "TAKE_AND_BRING") {
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

    const serviceVariables = [
      [options.serviceOptions, serviceOptions],
      [options.serviceOptionsIds, serviceOptions.map((s) => s)],
      [options.serviceOptionsNames, serviceOptions.map((s) => s.name)],
      [
        options.serviceOptionsDescriptions,
        serviceOptions.map((s) => s.description),
      ],
    ];

    serviceVariables.forEach(([id, value]) => setVar(id as string, value));

    const additionalOptionVariables = [
      [options.additionalOptions, additionalOptions],
      [options.additionalOptionsIds, additionalOptions.map((s) => s)],
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
      [
        options.recommendedServiceOptionsIds,
        recommendedServiceOptions.map((s) => s),
      ],
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
  } catch (error) {
    console.error(error);
  }
};
