import {
  type PaEmployeeFilter,
  type PaEmployeeResponse,
  type ServiceCategoryType,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
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
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const selectedService: ServiceOptionType = JSON.parse(
          options.selectedService ?? "",
        );

        const shopId = Number(options.shopId);

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
              selectedService.services.map(
                (service) => service.serviceCategory.id,
              ),
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

        filters["serviceCategoryIds"] = servicesCategoriesIds;

        const tecpetSdk = new TecpetSDK(
          (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
          credentials.apiKey as string,
        );

        const employees: PaEmployeeResponse[] =
          await tecpetSdk.employee.getEmployeesByServiceCategory(
            filters,
            shopId,
          );

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
