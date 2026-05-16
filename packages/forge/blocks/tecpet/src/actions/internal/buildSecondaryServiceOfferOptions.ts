import type {
  PaServiceRecommendationGroup,
  PaSimpleServiceResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import type { ServiceOptionType } from "./buildServiceOptions";

export const buildSecondaryServiceOfferOptions = createAction({
  baseOptions,
  name: "Construir opções de adicionais recomendados",
  options: option.object({
    secondaryGroups: option.string.layout({
      label: "Grupos secundários (SECONDARY_SERVICE_OFFER)",
      isRequired: true,
    }),
    serviceId: option.number.layout({
      label: "Id do serviço selecionado",
      isRequired: true,
    }),
    additionalServices: option.string.layout({
      label: "Serviços adicionais",
      isRequired: true,
    }),
    recommendedAdditionalOptions: option.string.layout({
      label: "Adicionais recomendados",
      placeholder: "Selecione",
      isRequired: true,
      inputType: "variableDropdown",
    }),
    recommendedAdditionalOptionsIds: option.string.layout({
      label: "Ids de adicionais recomendados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    recommendedAdditionalOptionsNames: option.string.layout({
      label: "Nomes de adicionais recomendados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    recommendedAdditionalOptionsDescriptions: option.string.layout({
      label: "Descrições de adicionais recomendados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    recommendedAdditionalOptions,
    recommendedAdditionalOptionsIds,
    recommendedAdditionalOptionsNames,
    recommendedAdditionalOptionsDescriptions,
  }) => {
    const variables: string[] = [];

    if (recommendedAdditionalOptions)
      variables.push(recommendedAdditionalOptions);
    if (recommendedAdditionalOptionsIds)
      variables.push(recommendedAdditionalOptionsIds);
    if (recommendedAdditionalOptionsNames)
      variables.push(recommendedAdditionalOptionsNames);
    if (recommendedAdditionalOptionsDescriptions)
      variables.push(recommendedAdditionalOptionsDescriptions);

    return variables;
  },
});

export const BuildSecondaryServiceOfferOptionsHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const serviceId = Number(options.serviceId);

    const rawAdditionalServices: ServiceOptionType[] = JSON.parse(
      options.additionalServices as string,
    );
    const additionalServices: ServiceOptionType[] = rawAdditionalServices.map(
      (item) => (typeof item === "string" ? JSON.parse(item) : item),
    );

    const rawSecondaryGroups: PaServiceRecommendationGroup[] = JSON.parse(
      options.secondaryGroups as string,
    );
    const secondaryGroups: PaServiceRecommendationGroup[] =
      rawSecondaryGroups.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );

    const seenIds = new Set<number>();
    const secondaryServices: PaSimpleServiceResponse[] = secondaryGroups
      .filter((group) => group.selectedService?.id === serviceId)
      .flatMap((group) => group.recommendedServices)
      .filter((service) => {
        if (seenIds.has(service.id)) return false;
        seenIds.add(service.id);
        return true;
      });

    const recommendedAdditionalOptions: ServiceOptionType[] = [];

    for (const additional of additionalServices) {
      if (
        secondaryServices &&
        secondaryServices.some((s) => s.id === additional.id)
      ) {
        recommendedAdditionalOptions.push({
          id: additional.id,
          name: additional.name,
          price: additional.price,
          description: additional.description,
          type: "SERVICE",
          services: [],
          category: additional.category,
        });
      }
    }

    if (recommendedAdditionalOptions.length > 0) {
      recommendedAdditionalOptions.push({
        id: -1,
        name: "VER OUTROS ADICIONAIS",
        price: 0,
        description: "",
        type: "SERVICE",
        services: [],
        category: null as any,
      });
    }

    variables.set([
      {
        id: options.recommendedAdditionalOptions as string,
        value: recommendedAdditionalOptions,
      },
      {
        id: options.recommendedAdditionalOptionsIds as string,
        value: recommendedAdditionalOptions.map((s) => s.id),
      },
      {
        id: options.recommendedAdditionalOptionsNames as string,
        value: recommendedAdditionalOptions.map((s) => s.name),
      },
      {
        id: options.recommendedAdditionalOptionsDescriptions as string,
        value: recommendedAdditionalOptions.map((s) => s.description),
      },
    ]);
  } catch (error) {
    console.error(error);
  }
};
