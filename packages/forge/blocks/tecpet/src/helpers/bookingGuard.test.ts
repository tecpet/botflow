import { describe, expect, it } from "bun:test";
import type { PaBookingGuardValidationResponseDto } from "@tec.pet/tecpet-sdk";
import {
  buildGuardServiceIds,
  resolveBookingGuardBlockedDates,
} from "./bookingGuard";

// Loja 454 (TP-4889): tosa na tesoura e tosa da raça barradas no sábado.
const SCISSOR_GROOM = 301352;
const BREED_GROOM = 301354;
const BATH = 301300;
const HYDRATION = 301400;
const TAKE_AND_BRING = 301500;

const SATURDAY = 6;
const SUNDAY = 0;

// 10/10/2026 é sábado.
const FRIDAY_ISO = "2026-10-09";
const SATURDAY_ISO = "2026-10-10";
const SUNDAY_ISO = "2026-10-11";
const MONDAY_ISO = "2026-10-12";
const TUESDAY_ISO = "2026-10-13";

const saturdayGuard = {
  id: "9080581a-116f-4602-a03c-029340f4dcab",
  name: "tosa tesoura sabado",
  description: "Tosa na tesoura não é feita aos sábados.",
};

const weekdayOf = (dateISO: string) =>
  new Date(`${dateISO}T00:00:00Z`).getUTCDay();

/**
 * Validação de mentira: barra as datas cujo dia da semana está em
 * `blockedWeekdays`, falha nas datas de `failingDates` e registra as consultas.
 */
const fakeValidation = ({
  blockedWeekdays,
  failingDates = [],
}: {
  blockedWeekdays: number[];
  failingDates?: string[];
}) => {
  const calls: string[] = [];

  const validate = async (
    dateISO: string,
  ): Promise<PaBookingGuardValidationResponseDto> => {
    calls.push(dateISO);

    if (failingDates.includes(dateISO))
      throw { statusCode: 500, message: "erro" };

    const blocked = blockedWeekdays.includes(weekdayOf(dateISO));

    return {
      blocked,
      guard: blocked ? saturdayGuard : (null as never),
    };
  };

  return { calls, validate };
};

describe("buildGuardServiceIds", () => {
  const scissorGroom = {
    id: SCISSOR_GROOM,
    type: "SERVICE" as const,
    services: [],
  };

  it("serviço do catálogo + adicionais + leva e traz", () => {
    expect(
      buildGuardServiceIds({
        selectedService: scissorGroom,
        catalogServiceIds: [SCISSOR_GROOM, BREED_GROOM],
        selectedAdditionalIds: [HYDRATION],
        takeAndBringId: TAKE_AND_BRING,
      }).services,
    ).toEqual([SCISSOR_GROOM, HYDRATION, TAKE_AND_BRING]);
  });

  it("serviço fora do catálogo não entra, como sempre foi na confirmação", () => {
    expect(
      buildGuardServiceIds({
        selectedService: scissorGroom,
        catalogServiceIds: [BREED_GROOM],
        selectedAdditionalIds: [],
        takeAndBringId: null,
      }).services,
    ).toEqual([]);
  });

  it("combo é aberto nos serviços que o compõem", () => {
    const result = buildGuardServiceIds({
      selectedService: {
        id: 900,
        type: "COMBO",
        services: [{ id: BATH }, { id: SCISSOR_GROOM }] as never,
      },
      catalogServiceIds: [],
      selectedAdditionalIds: [],
      takeAndBringId: null,
    });

    expect(result.services).toEqual([BATH, SCISSOR_GROOM]);
    expect(result.comboServiceIds).toEqual([BATH, SCISSOR_GROOM]);
  });

  it("sem repetidos e sem o sentinela -1", () => {
    expect(
      buildGuardServiceIds({
        selectedService: scissorGroom,
        catalogServiceIds: [SCISSOR_GROOM],
        selectedAdditionalIds: [SCISSOR_GROOM, -1],
        takeAndBringId: null,
      }).services,
    ).toEqual([SCISSOR_GROOM]);
  });
});

describe("resolveBookingGuardBlockedDates", () => {
  it("restrição de sábado: tira só o sábado da janela", async () => {
    const { calls, validate } = fakeValidation({ blockedWeekdays: [SATURDAY] });

    const result = await resolveBookingGuardBlockedDates({
      dates: [FRIDAY_ISO, SATURDAY_ISO],
      validate,
    });

    expect([...result.blockedDates]).toEqual([[SATURDAY_ISO, saturdayGuard]]);
    expect(result.dateIndependent).toBe(false);
    // A sexta liberada já prova que a restrição depende do dia.
    expect(calls).toEqual([FRIDAY_ISO, SATURDAY_ISO]);
  });

  it("janela sem dia barrado: uma validação por data e nada sai", async () => {
    const { calls, validate } = fakeValidation({ blockedWeekdays: [SATURDAY] });

    const result = await resolveBookingGuardBlockedDates({
      dates: [MONDAY_ISO, TUESDAY_ISO],
      validate,
    });

    expect(result.blockedDates.size).toBe(0);
    expect(result.dateIndependent).toBe(false);
    expect(calls).toEqual([MONDAY_ISO, TUESDAY_ISO]);
  });

  it("restrição de sábado e domingo: valida a semana e a janela inteira sai", async () => {
    const { calls, validate } = fakeValidation({
      blockedWeekdays: [SATURDAY, SUNDAY],
    });

    const result = await resolveBookingGuardBlockedDates({
      dates: [SATURDAY_ISO, SUNDAY_ISO],
      validate,
    });

    expect([...result.blockedDates.keys()]).toEqual([SATURDAY_ISO, SUNDAY_ISO]);
    expect(result.dateIndependent).toBe(false);
    // Um dia de cada da semana, sem repetir os da janela.
    expect(calls).toHaveLength(7);
    expect(new Set(calls.map(weekdayOf)).size).toBe(7);
  });

  it("restrição sem dia da semana: não filtra, a confirmação barra com a mensagem", async () => {
    const { calls, validate } = fakeValidation({
      blockedWeekdays: [0, 1, 2, 3, 4, 5, 6],
    });

    const result = await resolveBookingGuardBlockedDates({
      dates: [FRIDAY_ISO, SATURDAY_ISO],
      validate,
    });

    expect(result.blockedDates.size).toBe(0);
    expect(result.dateIndependent).toBe(true);
    expect(calls).toHaveLength(7);
  });

  it("falha na validação mantém a data", async () => {
    const { validate } = fakeValidation({
      blockedWeekdays: [SATURDAY],
      failingDates: [SATURDAY_ISO],
    });

    const result = await resolveBookingGuardBlockedDates({
      dates: [FRIDAY_ISO, SATURDAY_ISO],
      validate,
    });

    expect(result.blockedDates.size).toBe(0);
    expect(result.failedDates.map(({ dateISO }) => dateISO)).toEqual([
      SATURDAY_ISO,
    ]);
  });

  it("sem como provar que algum dia passa: não filtra", async () => {
    // Sábado barrado, e a validação dos dias em que a restrição não vale falhou.
    const { validate } = fakeValidation({
      blockedWeekdays: [SATURDAY],
      failingDates: [
        SUNDAY_ISO,
        MONDAY_ISO,
        TUESDAY_ISO,
        "2026-10-14",
        "2026-10-15",
        "2026-10-16",
      ],
    });

    const result = await resolveBookingGuardBlockedDates({
      dates: [SATURDAY_ISO, SUNDAY_ISO],
      validate,
    });

    expect(result.blockedDates.size).toBe(0);
    expect(result.dateIndependent).toBe(true);
    expect(result.failedDates).toHaveLength(6);
  });
});
