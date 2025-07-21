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
  id: number;
  name: string;
  category: ServiceCategoryType;
}

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
    employeeServices: option.string.layout({
      label: "Serviços para cada funcionário",
      isRequired: true,
      helperText: "Serviços para cada funcionário",
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
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const selectedService: ServiceOptionType = JSON.parse(
          options.selectedService ?? "",
        );

        const shopId = Number(options.shopId);

        const filters: PaEmployeeFilter = { serviceCategoryIds: [] };

        let servicesCategoriesIds: number[] = [];

        let employeeIndicationServices: EmployeeServiceIndicationOption[] = [];

        if (selectedService.type === "COMBO") {
          employeeIndicationServices = selectedService.services.map(
            (service) => {
              return {
                id: service.id,
                name: service.name,
                category: service.serviceCategory.type,
              };
            },
          );

          servicesCategoriesIds = [
            ...new Set(
              selectedService.services.map(
                (service) => service.serviceCategory.id,
              ),
            ),
          ];
        }

        if (selectedService.type === "SERVICE") {
          employeeIndicationServices.push({
            id: selectedService.id,
            name: selectedService.name,
            category: selectedService.category.type,
          });

          servicesCategoriesIds = [selectedService.category.id];
        }

        filters["serviceCategoryIds"] = servicesCategoriesIds;

        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const employees: PaEmployeeResponse[] =
          await tecpetSdk.employee.getEmployeesByServiceCategory(
            filters,
            shopId,
          );

        variables.set([
          {
            id: options.employeeServices as string,
            value: employeeIndicationServices,
          },
        ]);

        variables.set([{ id: options.employees as string, value: employees }]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
