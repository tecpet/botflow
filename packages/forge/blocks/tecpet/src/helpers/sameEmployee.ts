import type {
  PaEmployeeIndication,
  PaEmployeeResponse,
} from "@tec.pet/tecpet-sdk";
import type { EmployeeServiceIndicationOption } from "../actions/api/employee/getEmployees";
import { formatPtBrList } from "./groupReschedule";

/**
 * A flag chega pelo fluxo como texto (`{{Loja.ManterMesmoProfissional}}`) ou,
 * em variável não preenchida, vazia — e vazia vale como desligada.
 */
export const parsePreferSameEmployee = (value: unknown): boolean =>
  value === true ||
  String(value ?? "")
    .trim()
    .toLowerCase() === "true";

const coversCategories = (
  employee: PaEmployeeResponse,
  categories: EmployeeServiceIndicationOption["category"][],
) =>
  categories.every((type) =>
    employee.categories?.some((category) => category.type === type),
  );

/**
 * Com a loja preferindo um profissional só por agendamento (TP-4743), as
 * categorias do serviço viram uma pergunta única ("Banho e Tosa") e só ficam
 * na lista os profissionais que atendem todas elas. Sem a flag, o cliente
 * escolhia um profissional por categoria e o agendamento saía dividido.
 *
 * Se ninguém cobre todas as categorias, segue a pergunta por categoria: como
 * no servidor, é preferência, e não pode deixar o cliente sem profissional.
 */
export const groupCategoriesForSameEmployee = ({
  preferSameEmployee,
  categories,
  employees,
}: {
  preferSameEmployee: boolean;
  categories: EmployeeServiceIndicationOption[];
  employees: PaEmployeeResponse[];
}): {
  categories: EmployeeServiceIndicationOption[];
  employees: PaEmployeeResponse[];
  grouped: boolean;
} => {
  if (!preferSameEmployee || categories.length < 2)
    return { categories, employees, grouped: false };

  const types = categories.map((category) => category.category);
  const coveringAll = employees.filter((employee) =>
    coversCategories(employee, types),
  );

  if (!coveringAll.length) return { categories, employees, grouped: false };

  return {
    categories: [
      {
        name: formatPtBrList(categories.map((category) => category.name)),
        category: types[0],
        categories: types,
      },
    ],
    employees: coveringAll,
    grouped: true,
  };
};

/**
 * Valor da opção de um profissional para a pergunta atual. Pergunta de uma
 * categoria mantém o formato de sempre (`{ id, serviceCategoryId }`); a
 * agrupada vira uma indicação por categoria, todas com o mesmo profissional.
 * `null` quando o profissional não atende alguma das categorias.
 */
export const buildEmployeeIndicationValue = (
  employee: PaEmployeeResponse,
  target: EmployeeServiceIndicationOption,
): PaEmployeeIndication | PaEmployeeIndication[] | null => {
  const types = target.categories?.length
    ? target.categories
    : [target.category];

  const indications: PaEmployeeIndication[] = [];

  for (const type of types) {
    const category = employee.categories?.find((item) => item.type === type);
    if (!category) return null;
    indications.push({ id: employee.id, serviceCategoryId: category.id });
  }

  return indications.length === 1 ? indications[0] : indications;
};

/**
 * A escolha agrupada entra em `Funcionarios.Selecionados` como um item só com
 * a lista de indicações; quem lê a variável espalha esses itens.
 */
export const flattenEmployeeIndications = <T>(items: Array<T | T[]>): T[] =>
  items.flatMap((item) => (Array.isArray(item) ? item : [item]));
