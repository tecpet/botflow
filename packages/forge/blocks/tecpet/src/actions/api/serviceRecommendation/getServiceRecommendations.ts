import type {
  PaGetServiceRecommendationGroupResponse,
  PaServiceRecommendationGroup,
  PaSimpleServiceResponse,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import {
  ServiceRecommendationGroupTypeEnum,
  ServiceRecommendationScopeEnum,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getServiceRecommendations = createAction({
  auth,
  baseOptions,
  name: "Buscar serviços recomendados para o pet",
  options: option.object({
    shopId: option.number.layout({
      label: "Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.number.layout({
      label: "Id do Pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    primaryServices: option.string.layout({
      label: "Serviços primários (PRIMARY_SERVICE_OFFER)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    secondaryGroups: option.string.layout({
      label: "Grupos secundários (SECONDARY_SERVICE_OFFER)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    primaryServices,

    secondaryGroups,
  }) => {
    const variables = [];

    if (primaryServices) variables.push(primaryServices);

    if (secondaryGroups) variables.push(secondaryGroups);

    return variables;
  },
});
export const GetServiceRecommendationsHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const segmentType = options.segmentType as ShopSegment;

    const recommendedServicesResponse: PaGetServiceRecommendationGroupResponse =
      (await tecpetSdk.serviceRecommendation.validation(
        {
          petId: Number(options.petId),
          segmentType,
          scope: ServiceRecommendationScopeEnum.BOT,
        },
        Number(options?.shopId),
      )) as PaGetServiceRecommendationGroupResponse;

    if (
      recommendedServicesResponse &&
      recommendedServicesResponse.data.length > 0
    ) {
      const { PRIMARY_SERVICE_OFFER, SECONDARY_SERVICE_OFFER } =
        ServiceRecommendationGroupTypeEnum;

      const seenIds = new Set<number>();
      const primaryServices: PaSimpleServiceResponse[] = [];

      recommendedServicesResponse.data
        .filter((group) => group.type === PRIMARY_SERVICE_OFFER)
        .flatMap((group) => group.recommendedServices)
        .forEach((service) => {
          if (!seenIds.has(service.id)) {
            seenIds.add(service.id);
            primaryServices.push(service);
          }
        });

      const secondaryGroups: PaServiceRecommendationGroup[] =
        recommendedServicesResponse.data.filter(
          (group) => group.type === SECONDARY_SERVICE_OFFER,
        );

      variables.set([
        { id: options.primaryServices as string, value: primaryServices },
        { id: options.secondaryGroups as string, value: secondaryGroups },
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};
