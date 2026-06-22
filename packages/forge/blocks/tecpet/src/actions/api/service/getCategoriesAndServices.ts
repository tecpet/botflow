import type {
  PaGetServicePricingResponse,
  ServiceCategoryType,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";

export const getCategoriesAndServices = createAction({
  auth,
  baseOptions,
  name: "Buscar serviços com Preço da Loja",
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
});
export const GetCategoriesAndServicesHandler = async ({
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

    logHandler("getCategoriesAndServices", { shopId: Number(options?.shopId), petId: Number(options.petId), segmentType });

    let serviceCategoryTypes: ServiceCategoryType[] = [];

    if (options.segmentType === "PET_SHOP") {
      serviceCategoryTypes = [
        "BATH",
        "GROOM",
        "TAKE_AND_BRING",
        "CUSTOM",
        "ADDITIONAL",
      ] as ServiceCategoryType[];
    }

    if (options.segmentType === "CLINIC") {
      serviceCategoryTypes = [
        "CLINIC",
        "CUSTOM",
        "TAKE_AND_BRING",
        "ADDITIONAL",
      ] as ServiceCategoryType[];
    }

    const categories: PaGetServicePricingResponse[] =
      (await tecpetSdk.service.pricing(
        Number(options.petId),
        segmentType,
        serviceCategoryTypes,
        Number(options?.shopId),
      )) as PaGetServicePricingResponse[];

    if (categories && categories.length > 0) {
      const servicesIds = categories.flatMap((category) =>
        category.services.map((service) => service.id),
      );

      logHandler("getCategoriesAndServices", { serviceCategoryTypes, categories: summarizeArray(categories), servicesIds: summarizeArray(servicesIds) });

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
};
