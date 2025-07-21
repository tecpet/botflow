import type {
  PaEmployeeIndication,
  PaEmployeeResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
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
    employeeServiceIndications: option.string.layout({
      label: "Serviços para indicação de funcionário",
      isRequired: true,
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
  getSetVariableIds: ({}) => {
    const variables: Array<string> = [];

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        const parsedEmployees: string[] = JSON.parse(
          options.employees as string,
        );

        const employees: PaEmployeeResponse[] = parsedEmployees.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );

        const parsedServices: string[] = JSON.parse(
          options.employeeServiceIndications as string,
        );

        const services: EmployeeServiceIndicationOption[] = parsedServices.map(
          (item) => (typeof item === "string" ? JSON.parse(item) : item),
        );

        const employeeIndications: Array<
          PaEmployeeIndication & { name?: string }
        > = [];

        employees.forEach((employee) => {
          const category = employee.categories.find(
            (category) => services[0].category === category.type,
          );

          if (category) {
            employeeIndications.push({
              id: employee.id,
              name: employee.name,
              serviceCategoryType: category.type,
            });
          }
        });

        variables.set([
          {
            id: options.employeeNames as string,
            value: employeeIndications.map((t) => t.name),
          },
          {
            id: options.employeeValues as string,
            value: employeeIndications.map((e) => {
              return { id: e.id, serviceCategoryType: e.serviceCategoryType };
            }),
          },
          {
            id: options.serviceIndicationName as string,
            value: services[0].name,
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
