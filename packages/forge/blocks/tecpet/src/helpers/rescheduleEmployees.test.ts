import { describe, expect, it } from "bun:test";
import type { PaEmployeeIndication, TecpetSDK } from "@tec.pet/tecpet-sdk";
import {
  buildRelaxedIndications,
  type CategoryEmployees,
  EmployeeFallbackReason,
  findUnavailableIndications,
  hasOtherCategoryEmployees,
  listIndicationCategoryEmployees,
  resolveBookingEmployeeNames,
  resolveIndicatedEmployeeNames,
  resolveRestrictedIndication,
  searchKeepingRescheduleEmployees,
} from "./rescheduleEmployees";

const BATH = 10;
const GROOM = 20;

const maria: PaEmployeeIndication = { id: 1, serviceCategoryId: BATH };
const joao: PaEmployeeIndication = { id: 2, serviceCategoryId: GROOM };

const indicationKey = (indication: PaEmployeeIndication[]) =>
  indication.map((item) => `${item.id}:${item.serviceCategoryId}`).join(",");

/**
 * Busca de mentira: devolve um horário para cada indicação listada em
 * `withTimes` e registra a ordem das tentativas.
 */
const fakeSearch = (withTimes: PaEmployeeIndication[][]) => {
  const calls: string[] = [];
  const keysWithTimes = new Set(withTimes.map(indicationKey));

  const search = async (indication: PaEmployeeIndication[]) => {
    calls.push(indicationKey(indication));
    return keysWithTimes.has(indicationKey(indication)) ? ["08:00"] : [];
  };

  return { calls, search };
};

const hasTimes = (times: string[]) => times.length > 0;

const noneUnavailable = async () => [];

describe("buildRelaxedIndications", () => {
  it("indicação de um profissional só: não há passo intermediário", () => {
    expect(buildRelaxedIndications([maria], [])).toEqual([]);
  });

  it("dois profissionais: tira um por vez, na ordem dos serviços", () => {
    expect(buildRelaxedIndications([maria, joao], [])).toEqual([
      [joao],
      [maria],
    ]);
  });

  it("tira primeiro quem não atende mais a categoria", () => {
    expect(buildRelaxedIndications([maria, joao], [maria])).toEqual([[joao]]);
  });

  it("todos indisponíveis: sobra só o último recurso de quem chama", () => {
    expect(buildRelaxedIndications([maria, joao], [maria, joao])).toEqual([]);
  });
});

describe("searchKeepingRescheduleEmployees", () => {
  it("o profissional tem horário: não troca nem consulta a lista de funcionários", async () => {
    const { calls, search } = fakeSearch([[maria]]);
    let listedEmployees = false;

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria],
      search,
      hasTimes,
      findUnavailable: async () => {
        listedEmployees = true;
        return [];
      },
    });

    expect(result).toEqual({
      result: ["08:00"],
      indication: [maria],
      dropped: [],
      reason: null,
    });
    expect(calls).toEqual(["1:10"]);
    expect(listedEmployees).toBe(false);
  });

  it("sem indicação: uma busca só, sem fallback", async () => {
    const { calls, search } = fakeSearch([]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result.dropped).toEqual([]);
    expect(result.reason).toBeNull();
    expect(calls).toEqual([""]);
  });

  it("profissional bloqueado: busca com qualquer um e o motivo é NO_TIMES", async () => {
    const { calls, search } = fakeSearch([[]]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result).toEqual({
      result: ["08:00"],
      indication: [],
      dropped: [maria],
      reason: EmployeeFallbackReason.NO_TIMES,
    });
    expect(calls).toEqual(["1:10", ""]);
  });

  it("profissional inativo: o motivo é EMPLOYEE_UNAVAILABLE", async () => {
    const { search } = fakeSearch([[]]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria],
      search,
      hasTimes,
      findUnavailable: async () => [maria],
    });

    expect(result.dropped).toEqual([maria]);
    expect(result.reason).toBe(EmployeeFallbackReason.EMPLOYEE_UNAVAILABLE);
  });

  it("Banho + Tosa com a Maria bloqueada: o João continua na Tosa", async () => {
    const { calls, search } = fakeSearch([[joao], []]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria, joao],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result.indication).toEqual([joao]);
    expect(result.dropped).toEqual([maria]);
    expect(calls).toEqual(["1:10,2:20", "2:20"]);
  });

  it("Banho + Tosa com o João bloqueado: a Maria continua no Banho", async () => {
    const { calls, search } = fakeSearch([[maria], []]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria, joao],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result.indication).toEqual([maria]);
    expect(result.dropped).toEqual([joao]);
    expect(calls).toEqual(["1:10,2:20", "2:20", "1:10"]);
  });

  it("nenhuma combinação parcial fecha: busca com qualquer profissional", async () => {
    const { calls, search } = fakeSearch([[]]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria, joao],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result.indication).toEqual([]);
    expect(result.dropped).toEqual([maria, joao]);
    expect(calls).toEqual(["1:10,2:20", "2:20", "1:10", ""]);
  });

  it("ninguém tem horário nem sem indicação: devolve a busca vazia com o motivo", async () => {
    const { search } = fakeSearch([]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result.result).toEqual([]);
    expect(result.dropped).toEqual([maria]);
    expect(result.reason).toBe(EmployeeFallbackReason.NO_TIMES);
  });
});

describe("findUnavailableIndications", () => {
  const sdkListing = (
    employeesByCategory: Record<number, number[]>,
    failingCategories: number[] = [],
  ) =>
    ({
      employee: {
        getEmployeesByServiceCategory: async ({
          serviceCategoryIds,
        }: {
          serviceCategoryIds: number[];
        }) => {
          const [categoryId] = serviceCategoryIds;

          if (failingCategories.includes(categoryId))
            throw { statusCode: 500, message: "erro" };

          return (employeesByCategory[categoryId] ?? []).map((id) => ({ id }));
        },
      },
    }) as unknown as TecpetSDK;

  it("marca quem não aparece na lista de ativos da categoria", async () => {
    const sdk = sdkListing({ [BATH]: [3], [GROOM]: [2] });

    expect(await findUnavailableIndications(sdk, 822, [maria, joao])).toEqual([
      maria,
    ]);
  });

  it("falha na consulta não marca ninguém como indisponível", async () => {
    const sdk = sdkListing({ [GROOM]: [] }, [BATH]);

    expect(await findUnavailableIndications(sdk, 822, [maria, joao])).toEqual([
      joao,
    ]);
  });
});

describe("resolveBookingEmployeeNames", () => {
  const booking = {
    services: [
      { id: 100, categoryId: BATH, employee: { id: 1, name: "Maria" } },
      { id: 101, categoryId: GROOM, employee: { id: 2, name: "João" } },
      { id: 102, categoryId: BATH, employee: { id: 1, name: "Maria" } },
    ],
  };

  it("devolve os nomes dos profissionais trocados, sem repetir", () => {
    expect(resolveBookingEmployeeNames(booking, [maria])).toEqual(["Maria"]);
    expect(resolveBookingEmployeeNames(booking, [maria, joao])).toEqual([
      "Maria",
      "João",
    ]);
  });

  it("sem troca, sem nomes", () => {
    expect(resolveBookingEmployeeNames(booking, [])).toEqual([]);
  });
});

describe("listIndicationCategoryEmployees", () => {
  /** SDK de mentira: devolve os funcionários (id e nome) de cada categoria. */
  const sdkWithEmployees = (
    employeesByCategory: Record<number, { id: number; name: string }[]>,
    failingCategories: number[] = [],
  ) => {
    const calls: number[] = [];
    const sdk = {
      employee: {
        getEmployeesByServiceCategory: async ({
          serviceCategoryIds,
        }: {
          serviceCategoryIds: number[];
        }) => {
          const [categoryId] = serviceCategoryIds;

          calls.push(categoryId);

          if (failingCategories.includes(categoryId))
            throw { statusCode: 500, message: "erro" };

          return employeesByCategory[categoryId] ?? [];
        },
      },
    } as unknown as TecpetSDK;

    return { calls, sdk };
  };

  it("consulta cada categoria uma vez", async () => {
    const { calls, sdk } = sdkWithEmployees({
      [BATH]: [{ id: 1, name: "Maria" }],
      [GROOM]: [{ id: 2, name: "João" }],
    });

    const employees = await listIndicationCategoryEmployees(sdk, 822, [
      maria,
      { id: 3, serviceCategoryId: BATH },
      joao,
    ]);

    expect(calls).toEqual([BATH, GROOM]);
    expect(employees.get(GROOM)).toEqual([{ id: 2, name: "João" }]);
  });

  it("categoria com consulta falha fica fora do mapa", async () => {
    const { sdk } = sdkWithEmployees({ [BATH]: [{ id: 1, name: "Maria" }] }, [
      GROOM,
    ]);

    const employees = await listIndicationCategoryEmployees(sdk, 822, [
      maria,
      joao,
    ]);

    expect([...employees.keys()]).toEqual([BATH]);
  });
});

describe("resolveIndicatedEmployeeNames", () => {
  it("devolve os nomes na ordem da escolha", () => {
    // TP-5050: a indicação escolhida na lista só traz o id, e o anúncio
    // "horários disponíveis com o João" precisa do nome.
    const employees: CategoryEmployees = new Map([
      [
        BATH,
        [
          { id: 1, name: "Maria" },
          { id: 3, name: "Ana" },
        ],
      ],
      [GROOM, [{ id: 2, name: " João " }]],
    ]);

    expect(resolveIndicatedEmployeeNames(employees, [joao, maria])).toEqual([
      "João",
      "Maria",
    ]);
  });

  it("o mesmo profissional em duas categorias aparece uma vez", () => {
    const employees: CategoryEmployees = new Map([
      [BATH, [{ id: 2, name: "João" }]],
      [GROOM, [{ id: 2, name: "João" }]],
    ]);

    expect(
      resolveIndicatedEmployeeNames(employees, [
        { id: 2, serviceCategoryId: BATH },
        joao,
      ]),
    ).toEqual(["João"]);
  });

  it("com um nome faltando, não devolve nenhum", () => {
    const employees: CategoryEmployees = new Map([
      [BATH, [{ id: 1, name: "Maria" }]],
    ]);

    expect(resolveIndicatedEmployeeNames(employees, [maria, joao])).toEqual([]);
  });
});

describe("hasOtherCategoryEmployees", () => {
  it("a Maria é a única do Banho: não há outro profissional", () => {
    // TP-5050: com um profissional só, "VER OUTROS PROFISSIONAIS" mostraria
    // os mesmos horários.
    const employees: CategoryEmployees = new Map([
      [BATH, [{ id: 1, name: "Maria" }]],
    ]);

    expect(hasOtherCategoryEmployees(employees, [maria])).toBe(false);
  });

  it("a Ana também faz Banho: há outro profissional", () => {
    const employees: CategoryEmployees = new Map([
      [
        BATH,
        [
          { id: 1, name: "Maria" },
          { id: 3, name: "Ana" },
        ],
      ],
    ]);

    expect(hasOtherCategoryEmployees(employees, [maria])).toBe(true);
  });

  it("basta uma categoria ter outro profissional", () => {
    const employees: CategoryEmployees = new Map([
      [BATH, [{ id: 1, name: "Maria" }]],
      [
        GROOM,
        [
          { id: 2, name: "João" },
          { id: 4, name: "Pedro" },
        ],
      ],
    ]);

    expect(hasOtherCategoryEmployees(employees, [maria, joao])).toBe(true);
  });

  it("o outro profissional de uma categoria não conta para a outra", () => {
    // O João só faz Tosa, então não é alternativa para o Banho da Maria.
    const employees: CategoryEmployees = new Map([
      [BATH, [{ id: 1, name: "Maria" }]],
      [GROOM, [{ id: 2, name: "João" }]],
    ]);

    expect(hasOtherCategoryEmployees(employees, [maria, joao])).toBe(false);
  });

  it("categoria com consulta falha conta como tendo outro", () => {
    expect(hasOtherCategoryEmployees(new Map(), [maria])).toBe(true);
  });
});

describe("resolveRestrictedIndication", () => {
  it("horário com o profissional do agendamento restringe a lista a ele", async () => {
    // TP-5050: a Maria tinha vaga num dos dias da janela, então o outro dia
    // (sem vaga só para ela) não aparecia. A lista é só dela.
    const { search } = fakeSearch([[maria]]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(resolveRestrictedIndication(result)).toEqual([maria]);
  });

  it("com troca de profissional, a lista não é restrita", async () => {
    const { search } = fakeSearch([[joao]]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [maria, joao],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(result.dropped).toEqual([maria]);
    expect(resolveRestrictedIndication(result)).toEqual([]);
  });

  it("busca com todos os profissionais não é restrita", async () => {
    const { search } = fakeSearch([[]]);

    const result = await searchKeepingRescheduleEmployees({
      indication: [],
      search,
      hasTimes,
      findUnavailable: noneUnavailable,
    });

    expect(resolveRestrictedIndication(result)).toEqual([]);
  });

  it("agendamento novo não tem busca de remarcação", () => {
    expect(resolveRestrictedIndication(null)).toEqual([]);
  });
});
