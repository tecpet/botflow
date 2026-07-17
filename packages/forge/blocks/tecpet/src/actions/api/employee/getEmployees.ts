import {
  type PaEmployeeFilter,
  type PaEmployeeResponse,
  type ServiceCategoryType,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import { parseIds, parseJsonArray } from "../../../helpers/utils";
import type { ServiceOptionType } from "../../internal/buildServiceOptions";

export interface EmployeeServiceIndicationOption {
  name: string;
  category: ServiceCategoryType;
}

export const serviceCategoryLabel = {
  ["BATH"]: "Banho",
  ["GROOM"]: "Tosa",
  ["CLINIC"]: "Clinica",
  ["DAY_CARE"]: "Creche",
  ["HOTEL"]: "Hotel",
  ["ADDITIONAL"]: "Adicional",
  ["CUSTOM"]: "Customizado",
  ["TAKE_AND_BRING"]: "Leva e Tráz",
};

export const getEmployess = createAction({
  auth,
  baseOptions,
  name: "Buscar Funcionários",
  options: option.object({
    selectedService: option.string.layout({
      label: "Serviço selecionado",
      isRequired: true,
      helperText: "Serviço selecionado",
    }),
    selectedAdditionals: option.string.layout({
      label: "Adicionais selecionados",
      isRequired: false,
      helperText: "Array de ids dos adicionais selecionados",
    }),
    additionalOptions: option.string.layout({
      label: "Opções de adicionais",
      isRequired: false,
      helperText: "Catálogo de adicionais disponíveis",
    }),
    employees: option.string.layout({
      label: "Valor dos funcionários",
      isRequired: true,
      helperText: "Valor da seleção funcionário",
      inputType: "variableDropdown",
    }),
    employeeServiceCategories: option.string.layout({
      label: "Categorias de serviço",
      isRequired: true,
      helperText: "Categorias de serviço para atribuir funcionário",
      inputType: "variableDropdown",
    }),
    shopId: option.number.layout({
      label: "Loja",
      isRequired: true,
      helperText: "ID da loja",
    }),
  }),
  getSetVariableIds: ({ selectedService }) => {
    const variables = [];

    if (selectedService) variables.push(selectedService);

    return variables;
  },
});
export const GetEmployessHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const selectedService: ServiceOptionType = JSON.parse(
      (options.selectedService as string) ?? "",
    );

    const shopId = Number(options.shopId);

    logHandler("getEmployess", { shopId, selectedServiceType: selectedService?.type, selectedServiceId: selectedService?.id });

    const filters: PaEmployeeFilter = { serviceCategoryIds: [] };

    let servicesCategoriesIds: number[] = [];

    const employeeServiceCategoriesIndication: EmployeeServiceIndicationOption[] =
      [];

    if (selectedService.type === "COMBO") {
      selectedService.services.forEach((service) => {
        const foundCategory = employeeServiceCategoriesIndication.find(
          (serviceCategory) =>
            service.serviceCategory.type === serviceCategory.category,
        );
        if (!foundCategory) {
          employeeServiceCategoriesIndication.push({
            name: serviceCategoryLabel[service.serviceCategory.type],
            category: service.serviceCategory.type,
          });
        }
      });

      servicesCategoriesIds = [
        ...new Set(
          selectedService.services.map((service) => service.serviceCategory.id),
        ),
      ];
    }

    if (selectedService.type === "SERVICE") {
      employeeServiceCategoriesIndication.push({
        name: serviceCategoryLabel[selectedService.category.type],
        category: selectedService.category.type,
      });

      servicesCategoriesIds = [selectedService.category.id];
    }

    // A Tosa (GROOM) é tratada como adicional nesta loja. Sem incluir a categoria
    // de tosa aqui, o profissional só é escolhido para o serviço principal (Banho)
    // e o availableTimes recebe indicação parcial — o que quebra o cálculo e cai
    // no atendimento humano. Incluímos as categorias dos adicionais GROOM
    // selecionados para que o fluxo também peça o profissional da tosa.
    const selectedAdditionalIds: number[] = options.selectedAdditionals
      ? parseIds(options.selectedAdditionals)
      : [];

    const additionalOptions: ServiceOptionType[] = options.additionalOptions
      ? parseJsonArray<ServiceOptionType>(options.additionalOptions)
      : [];

    const groomAdditionals = additionalOptions.filter(
      (additional) =>
        selectedAdditionalIds.includes(Number(additional.id)) &&
        additional.category?.type === "GROOM",
    );

    for (const groom of groomAdditionals) {
      const alreadyIndicated = employeeServiceCategoriesIndication.some(
        (serviceCategory) => serviceCategory.category === groom.category.type,
      );

      if (!alreadyIndicated) {
        employeeServiceCategoriesIndication.push({
          name: serviceCategoryLabel[groom.category.type],
          category: groom.category.type,
        });
      }

      if (!servicesCategoriesIds.includes(groom.category.id)) {
        servicesCategoriesIds.push(groom.category.id);
      }
    }

    filters["serviceCategoryIds"] = servicesCategoriesIds;

    logHandler("getEmployess", { servicesCategoriesIds, employeeServiceCategoriesIndication });

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const employees: PaEmployeeResponse[] =
      await tecpetSdk.employee.getEmployeesByServiceCategory(filters, shopId);

    logHandler("getEmployess", { employees: summarizeArray(employees) });

    variables.set([
      {
        id: options.employeeServiceCategories as string,
        value: employeeServiceCategoriesIndication,
      },
    ]);

    variables.set([{ id: options.employees as string, value: employees }]);
  } catch (error) {
    console.error(error);
  }
};
