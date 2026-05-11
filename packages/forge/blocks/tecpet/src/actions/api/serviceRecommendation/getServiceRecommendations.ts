import type {
  PaGetServiceRecommendationGroupResponse,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import { ServiceRecommendationScopeEnum, TecpetSDK } from "@tec.pet/tecpet-sdk";
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
    recommendedServices: option.string.layout({
      label: "Serviços recomendados",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ recommendedServices }) => {
    const variables = [];

    if (recommendedServices) variables.push(recommendedServices);

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
      const recommendedServices = recommendedServicesResponse.data.flatMap(
        (group) => group.recommendedServices.map((service) => service),
      );

      variables.set([
        {
          id: options.recommendedServices as string,
          value: recommendedServices,
        },
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};
