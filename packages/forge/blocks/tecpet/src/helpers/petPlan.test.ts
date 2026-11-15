import { describe, expect, it, mock } from "bun:test";
import {
  type PaPetPlanResolution,
  type PaPetPlanResponse,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import { isTecpetApiError, TecpetApiError } from "./apiErrors";
import {
  bookablePetPlanStatuses,
  isRouteNotFoundError,
  petPlanRefusalErrors,
  pickPetPlanFromList,
  pickPetPlanFromResolution,
  resolvePetPlanForBooking,
} from "./petPlan";

const BATH = 1;
const GROOM = 2;
const SHOP_ID = 822;
const PET_ID = 55;
const DATE = "2026-11-20";

const listedPlan = (
  id: number,
  controls: { serviceId: number; quantity: number; used: number }[],
  pet: PaPetPlanResponse["pet"] = null,
): PaPetPlanResponse =>
  ({
    id,
    pet,
    shared: pet === null,
    clientId: 10,
    invoices: [{ current: true, control: controls }],
  }) as unknown as PaPetPlanResponse;

const option = (
  petPlanId: number,
  coversAll: boolean,
  services: { serviceId: number; covered: boolean; remaining: number }[],
) => ({
  petPlanId,
  name: `Plano ${petPlanId}`,
  shared: false,
  endDate: "2026-12-31",
  coversAll,
  services,
});

const fakeSdk = ({
  resolve,
  list,
}: {
  resolve?: () => Promise<PaPetPlanResolution>;
  list?: () => Promise<PaPetPlanResponse[]>;
}) => {
  const resolveMock = mock(
    resolve ?? (async () => ({ recommendedPetPlanId: null, options: [] })),
  );
  const listMock = mock(list ?? (async () => []));
  return {
    sdk: { petPlan: { resolve: resolveMock, list: listMock } } as never,
    resolveMock,
    listMock,
  };
};

describe("pickPetPlanFromResolution", () => {
  it("usa a opção recomendada quando ela cobre tudo", () => {
    const plan = pickPetPlanFromResolution({
      recommendedPetPlanId: 20,
      options: [
        option(20, true, [
          { serviceId: BATH, covered: true, remaining: 2 },
          { serviceId: GROOM, covered: true, remaining: 1 },
        ]),
        option(10, true, [{ serviceId: BATH, covered: true, remaining: 5 }]),
      ],
    });

    expect(plan).toEqual({ petPlan: 20, services: [BATH, GROOM] });
  });

  it("agenda avulso quando a recomendada não cobre tudo", () => {
    const plan = pickPetPlanFromResolution({
      recommendedPetPlanId: 20,
      options: [
        option(20, false, [
          { serviceId: BATH, covered: true, remaining: 2 },
          { serviceId: GROOM, covered: false, remaining: 0 },
        ]),
      ],
    });

    expect(plan).toBeUndefined();
  });

  it("agenda avulso sem recomendação", () => {
    expect(
      pickPetPlanFromResolution({ recommendedPetPlanId: null, options: [] }),
    ).toBeUndefined();
    expect(pickPetPlanFromResolution(undefined)).toBeUndefined();
  });

  it("agenda avulso quando a recomendada não está entre as opções", () => {
    const plan = pickPetPlanFromResolution({
      recommendedPetPlanId: 99,
      options: [
        option(20, true, [{ serviceId: BATH, covered: true, remaining: 1 }]),
      ],
    });

    expect(plan).toBeUndefined();
  });

  it("envia só os serviços cobertos", () => {
    const plan = pickPetPlanFromResolution({
      recommendedPetPlanId: 20,
      options: [
        option(20, true, [
          { serviceId: BATH, covered: true, remaining: 1 },
          { serviceId: GROOM, covered: false, remaining: 0 },
        ]),
      ],
    });

    expect(plan).toEqual({ petPlan: 20, services: [BATH] });
  });
});

describe("pickPetPlanFromList", () => {
  it("escolhe o primeiro plano com saldo para todos os serviços", () => {
    const plan = pickPetPlanFromList(
      [
        listedPlan(1, [{ serviceId: BATH, quantity: 4, used: 4 }]),
        listedPlan(2, [{ serviceId: BATH, quantity: 4, used: 1 }]),
      ],
      [BATH],
    );

    expect(plan).toEqual({ petPlan: 2, services: [BATH] });
  });

  it("aceita plano do tutor, sem pet", () => {
    const plan = pickPetPlanFromList(
      [listedPlan(3, [{ serviceId: BATH, quantity: 8, used: 2 }], null)],
      [BATH],
    );

    expect(plan).toEqual({ petPlan: 3, services: [BATH] });
  });

  it("não escolhe nada sem serviço candidato", () => {
    expect(
      pickPetPlanFromList(
        [listedPlan(1, [{ serviceId: BATH, quantity: 4, used: 0 }])],
        [],
      ),
    ).toBeUndefined();
  });
});

describe("resolvePetPlanForBooking", () => {
  it("chama a rota com a data do agendamento e usa a recomendada", async () => {
    const { sdk, resolveMock, listMock } = fakeSdk({
      resolve: async () => ({
        recommendedPetPlanId: 7,
        options: [
          {
            ...option(7, true, [
              { serviceId: BATH, covered: true, remaining: 3 },
            ]),
            shared: true,
          },
        ],
      }),
    });

    const result = await resolvePetPlanForBooking({
      sdk,
      petId: PET_ID,
      date: DATE,
      serviceIds: [BATH],
      segmentType: ShopSegment.PET_SHOP,
      shopId: SHOP_ID,
    });

    expect(resolveMock).toHaveBeenCalledWith(
      {
        petId: PET_ID,
        date: DATE,
        serviceIds: [BATH],
        segmentType: ShopSegment.PET_SHOP,
      },
      SHOP_ID,
    );
    expect(listMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      plan: { petPlan: 7, services: [BATH] },
      source: "resolve",
      optionsFound: 1,
    });
  });

  it("não manda segmentType vazio", async () => {
    const { sdk, resolveMock } = fakeSdk({});

    await resolvePetPlanForBooking({
      sdk,
      petId: PET_ID,
      date: DATE,
      serviceIds: [BATH],
      shopId: SHOP_ID,
    });

    expect(resolveMock).toHaveBeenCalledWith(
      { petId: PET_ID, date: DATE, serviceIds: [BATH] },
      SHOP_ID,
    );
  });

  it("cai na listagem antiga quando a rota não existe (404)", async () => {
    const { sdk, listMock } = fakeSdk({
      resolve: async () => {
        throw {
          statusCode: 404,
          message: "Cannot GET /v1/pet-plan/resolve",
          error: "Not Found",
        };
      },
      list: async () => [
        listedPlan(4, [{ serviceId: BATH, quantity: 4, used: 0 }]),
      ],
    });

    const result = await resolvePetPlanForBooking({
      sdk,
      petId: PET_ID,
      date: DATE,
      serviceIds: [BATH],
      shopId: SHOP_ID,
    });

    expect(listMock).toHaveBeenCalledWith(
      { petId: PET_ID, status: bookablePetPlanStatuses, vigente: true },
      SHOP_ID,
    );
    expect(result).toEqual({
      plan: { petPlan: 4, services: [BATH] },
      source: "list",
      optionsFound: 1,
    });
  });

  it("propaga erro que não é 404", async () => {
    const { sdk, listMock } = fakeSdk({
      resolve: async () => {
        throw { statusCode: 500, message: "boom" };
      },
    });

    await expect(
      resolvePetPlanForBooking({
        sdk,
        petId: PET_ID,
        date: DATE,
        serviceIds: [BATH],
        shopId: SHOP_ID,
      }),
    ).rejects.toEqual({ statusCode: 500, message: "boom" });
    expect(listMock).not.toHaveBeenCalled();
  });

  it("usa a listagem quando o horário não tem data", async () => {
    const { sdk, resolveMock, listMock } = fakeSdk({});

    const result = await resolvePetPlanForBooking({
      sdk,
      petId: PET_ID,
      date: undefined,
      serviceIds: [BATH],
      shopId: SHOP_ID,
    });

    expect(resolveMock).not.toHaveBeenCalled();
    expect(listMock).toHaveBeenCalled();
    expect(result.source).toBe("list");
  });

  it("não consulta nada sem pet ou sem serviço", async () => {
    const { sdk, resolveMock, listMock } = fakeSdk({});

    const noService = await resolvePetPlanForBooking({
      sdk,
      petId: PET_ID,
      date: DATE,
      serviceIds: [],
      shopId: SHOP_ID,
    });
    const noPet = await resolvePetPlanForBooking({
      sdk,
      petId: 0,
      date: DATE,
      serviceIds: [BATH],
      shopId: SHOP_ID,
    });

    expect(noService.plan).toBeUndefined();
    expect(noPet.plan).toBeUndefined();
    expect(resolveMock).not.toHaveBeenCalled();
    expect(listMock).not.toHaveBeenCalled();
  });
});

describe("isRouteNotFoundError", () => {
  it("reconhece só o 404", () => {
    expect(isRouteNotFoundError({ statusCode: 404 })).toBe(true);
    expect(isRouteNotFoundError({ statusCode: 403 })).toBe(false);
    expect(isRouteNotFoundError(new Error("network"))).toBe(false);
    expect(isRouteNotFoundError(undefined)).toBe(false);
  });
});

describe("petPlanRefusalErrors", () => {
  it.each([
    TecpetApiError.PET_PLAN_NOT_FROM_PET,
    TecpetApiError.PET_PLAN_NOT_FROM_SHOP,
  ])("trata %s pelo code como recusa de plano", (code) => {
    const error = { statusCode: 403, code, message: "Plano não é deste pet" };

    expect(
      petPlanRefusalErrors.some((apiError) =>
        isTecpetApiError(error, apiError),
      ),
    ).toBe(true);
  });

  it("não confunde recusa de horário com recusa de plano", () => {
    const error = {
      statusCode: 409,
      code: TecpetApiError.PET_ALREADY_BOOKED_AT_TIME,
      message: "Pet já agendado",
    };

    expect(
      petPlanRefusalErrors.some((apiError) =>
        isTecpetApiError(error, apiError),
      ),
    ).toBe(false);
  });
});
