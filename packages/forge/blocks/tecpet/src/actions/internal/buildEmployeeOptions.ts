import type {
  PaEmployeeIndication,
  PaEmployeeResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { buildEmployeeIndicationValue } from "../../helpers/sameEmployee";
import type { EmployeeServiceIndicationOption } from "../api/employee/getEmployees";

export const buildEmployeeOptions = createAction({
  baseOptions,
  name: "Construir opções de funcionários por categoria de serviço",
  options: option.object({
    employees: option.string.layout({
      label: "Valor dos funcionários",
      isRequired: true,
      helperText: "Valor da seleção funcionário",
    }),
    employeeServiceCategoriesIndication: option.string.layout({
      label: "Categorias de serviço",
      isRequired: true,
      helperText: "Categorias de serviço para atribuir funcionário",
    }),
    employeeNames: option.string.layout({
      label: "Titulo das opções de funcionário",
      isRequired: true,
      helperText: "Título da opção de funcionário",
      inputType: "variableDropdown",
    }),
    employeeValues: option.string.layout({
      label: "Valores das opções de funcionário",
      isRequired: true,
      helperText: "Valor da opção de funcionário",
      inputType: "variableDropdown",
    }),
    serviceIndicationName: option.string.layout({
      label: "Nome do serviço para escolher funcionário",
      isRequired: true,
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    serviceIndicationName,
    employeeNames,
    employeeValues,
  }) => {
    const variables: Array<string> = [];

    if (serviceIndicationName) variables.push(serviceIndicationName);
    if (employeeNames) variables.push(employeeNames);
    if (employeeValues) variables.push(employeeValues);

    return variables;
  },
});
export const BuildEmployeeOptionsHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const parsedEmployees: string[] = JSON.parse(options.employees as string);

    const employees: PaEmployeeResponse[] = parsedEmployees.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    );

    const parsedServiceCategories: string[] = JSON.parse(
      options.employeeServiceCategoriesIndication as string,
    );

    const servicesCategories: EmployeeServiceIndicationOption[] =
      parsedServiceCategories.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );

    const target = servicesCategories[0];

    logHandler("buildEmployeeOptions", {
      inputEmployees: summarizeArray(
        employees.map((e) => ({ id: e.id, name: e.name })),
      ),
      inputServiceCategories: summarizeArray(
        servicesCategories.map((c) => ({
          category: c.category,
          categories: c.categories,
          name: c.name,
        })),
      ),
      targetCategory: target?.category,
      targetCategories: target?.categories,
    });

    const employeeOptions: Array<{
      name: string;
      value: PaEmployeeIndication | PaEmployeeIndication[];
    }> = [];

    employees.forEach((employee) => {
      const value = buildEmployeeIndicationValue(employee, target);

      if (value) employeeOptions.push({ name: employee.name, value });
    });

    logHandler("buildEmployeeOptions", {
      outputEmployeeIndications: summarizeArray(employeeOptions),
      serviceIndicationName: target?.name,
    });

    variables.set([
      {
        id: options.employeeNames as string,
        value: employeeOptions.map((item) => item.name),
      },
      {
        id: options.employeeValues as string,
        value: employeeOptions.map((item) => item.value),
      },
      {
        id: options.serviceIndicationName as string,
        value: target.name,
      },
    ]);
  } catch (error) {
    console.error(error);
  }
};
