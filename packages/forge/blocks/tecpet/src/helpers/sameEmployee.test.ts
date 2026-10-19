import { describe, expect, it } from "bun:test";
import {
  type PaEmployeeResponse,
  ServiceCategoryType,
} from "@tec.pet/tecpet-sdk";
import type { EmployeeServiceIndicationOption } from "../actions/api/employee/getEmployees";
import {
  buildEmployeeIndicationValue,
  flattenEmployeeIndications,
  groupCategoriesForSameEmployee,
  offersEmployeeChoice,
  parsePreferSameEmployee,
} from "./sameEmployee";

const { BATH, GROOM } = ServiceCategoryType;
const BATH_ID = 10;
const GROOM_ID = 20;

const employee = (
  id: number,
  name: string,
  types: ServiceCategoryType[],
): PaEmployeeResponse =>
  ({
    id,
    name,
    categories: types.map((type) => ({
      id: type === BATH ? BATH_ID : GROOM_ID,
      name: type === BATH ? "Banho" : "Tosa",
      type,
    })),
  }) as unknown as PaEmployeeResponse;

const karoline = employee(1, "Karoline", [BATH, GROOM]);
const deise = employee(2, "Deise", [GROOM]);
const ana = employee(3, "Ana", [BATH]);

const bath: EmployeeServiceIndicationOption = {
  name: "Banho",
  category: BATH,
};
const groom: EmployeeServiceIndicationOption = {
  name: "Tosa",
  category: GROOM,
};

describe("parsePreferSameEmployee", () => {
  it("liga com true vindo como booleano ou texto do fluxo", () => {
    expect(parsePreferSameEmployee(true)).toBe(true);
    expect(parsePreferSameEmployee("true")).toBe(true);
    expect(parsePreferSameEmployee(" TRUE ")).toBe(true);
  });

  it("variável vazia ou ausente vale como desligada", () => {
    expect(parsePreferSameEmployee(undefined)).toBe(false);
    expect(parsePreferSameEmployee("")).toBe(false);
    expect(parsePreferSameEmployee("false")).toBe(false);
    expect(parsePreferSameEmployee("{{Loja.ManterMesmoProfissional}}")).toBe(
      false,
    );
  });
});

describe("groupCategoriesForSameEmployee", () => {
  it("sem a flag mantém uma pergunta por categoria", () => {
    const result = groupCategoriesForSameEmployee({
      preferSameEmployee: false,
      categories: [bath, groom],
      employees: [karoline, deise, ana],
    });

    expect(result).toEqual({
      categories: [bath, groom],
      employees: [karoline, deise, ana],
      grouped: false,
    });
  });

  it("serviço de uma categoria não muda com a flag", () => {
    const result = groupCategoriesForSameEmployee({
      preferSameEmployee: true,
      categories: [bath],
      employees: [karoline, ana],
    });

    expect(result.grouped).toBe(false);
    expect(result.categories).toEqual([bath]);
  });

  it("com a flag, Banho e Tosa viram uma pergunta só com quem faz os dois", () => {
    const result = groupCategoriesForSameEmployee({
      preferSameEmployee: true,
      categories: [bath, groom],
      employees: [karoline, deise, ana],
    });

    expect(result).toEqual({
      categories: [
        {
          name: "Banho e Tosa",
          category: BATH,
          categories: [BATH, GROOM],
        },
      ],
      employees: [karoline],
      grouped: true,
    });
  });

  it("ninguém faz tudo: volta para a pergunta por categoria", () => {
    const result = groupCategoriesForSameEmployee({
      preferSameEmployee: true,
      categories: [bath, groom],
      employees: [deise, ana],
    });

    expect(result).toEqual({
      categories: [bath, groom],
      employees: [deise, ana],
      grouped: false,
    });
  });
});

describe("buildEmployeeIndicationValue", () => {
  it("pergunta de uma categoria mantém o formato de sempre", () => {
    expect(buildEmployeeIndicationValue(karoline, groom)).toEqual({
      id: 1,
      serviceCategoryId: GROOM_ID,
    });
  });

  it("pergunta agrupada indica o mesmo profissional em todas as categorias", () => {
    const grouped: EmployeeServiceIndicationOption = {
      name: "Banho e Tosa",
      category: BATH,
      categories: [BATH, GROOM],
    };

    expect(buildEmployeeIndicationValue(karoline, grouped)).toEqual([
      { id: 1, serviceCategoryId: BATH_ID },
      { id: 1, serviceCategoryId: GROOM_ID },
    ]);
    expect(buildEmployeeIndicationValue(deise, grouped)).toBeNull();
  });

  it("profissional que não atende a categoria fica fora", () => {
    expect(buildEmployeeIndicationValue(ana, groom)).toBeNull();
  });
});

describe("offersEmployeeChoice", () => {
  it("um profissional só: não há o que escolher", () => {
    // TP-5050: a remarcação pula "Deseja selecionar um funcionário?".
    expect(offersEmployeeChoice([bath], [karoline])).toBe(false);
  });

  it("dois profissionais na mesma pergunta: há escolha", () => {
    expect(offersEmployeeChoice([bath], [karoline, ana])).toBe(true);
  });

  it("Banho e Tosa com um profissional possível em cada: não há escolha", () => {
    // A lista traz a Ana e a Deise, mas cada pergunta mostraria uma só.
    expect(offersEmployeeChoice([bath, groom], [ana, deise])).toBe(false);
  });

  it("basta uma pergunta ter duas opções", () => {
    expect(offersEmployeeChoice([bath, groom], [karoline, ana])).toBe(true);
  });

  it("pergunta agrupada conta só quem faz todas as categorias", () => {
    const grouped: EmployeeServiceIndicationOption = {
      name: "Banho e Tosa",
      category: BATH,
      categories: [BATH, GROOM],
    };

    expect(offersEmployeeChoice([grouped], [karoline, ana, deise])).toBe(false);
  });

  it("sem profissionais: não há escolha", () => {
    expect(offersEmployeeChoice([bath], [])).toBe(false);
  });
});

describe("flattenEmployeeIndications", () => {
  it("espalha a escolha agrupada junto das escolhas por categoria", () => {
    expect(
      flattenEmployeeIndications([
        [
          { id: 1, serviceCategoryId: BATH_ID },
          { id: 1, serviceCategoryId: GROOM_ID },
        ],
        { id: 3, serviceCategoryId: 30 },
      ]),
    ).toEqual([
      { id: 1, serviceCategoryId: BATH_ID },
      { id: 1, serviceCategoryId: GROOM_ID },
      { id: 3, serviceCategoryId: 30 },
    ]);
  });
});
