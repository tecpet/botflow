import { createAction, option } from "@typebot.io/forge";
import { TecpetSDK } from "tecpet-sdk";
import type { ShopSegment } from "../../../../../tecpet-sdk/dist/domain/segment/enum/segment.enum";
import type {
  PaGetServicePricingResponse,
  ServiceCategoryType,
} from "../../../../../tecpet-sdk/dist/domain/service/dto/pa.get-service-pricing.dto";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getCategoriesAndServices = createAction({
  auth,
  baseOptions,
  name: "Buscar serviçis com Preço da Loja",
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
    categoriesAndServices: option.string.layout({
      label: "Categorias e Serviços",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    servicesIds: option.string.layout({
      label: "Ids dos serviços",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ categoriesAndServices, servicesIds }) => {
    const variables = [];

    if (categoriesAndServices) variables.push(categoriesAndServices);
    if (servicesIds) variables.push(servicesIds);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const categories: PaGetServicePricingResponse[] =
          (await tecpetSdk.service.pricing(
            Number(options.petId),
            options.segmentType as ShopSegment,
            ["BATH", "ADDITIONAL"] as ServiceCategoryType[],
            Number(options?.shopId),
          )) as PaGetServicePricingResponse[];

        if (categories && categories.length > 0) {
          const servicesIds = categories.flatMap((category) =>
            category.services.map((service) => service.id),
          );

          variables.set([
            { id: options.categoriesAndServices as string, value: categories },
          ]);
          variables.set([
            { id: options.servicesIds as string, value: servicesIds },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
