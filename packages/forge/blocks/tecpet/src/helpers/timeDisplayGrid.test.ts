import { describe, expect, it } from "bun:test";
import {
  ChatbotTimeDisplayModeEnum,
  type PaShopConfigurationsSegment,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import {
  type DisplayGridOrigin,
  filterByDisplayGrid,
  intervalMinutesByDisplayMode,
  resolveDisplayGridOrigin,
} from "./timeDisplayGrid";

const slotsEvery5Min = (from: string, to: string, skip: string[] = []) => {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const format = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  const slots: { id: string; start: string; stop: string }[] = [];

  for (let m = toMinutes(from); m <= toMinutes(to); m += 5) {
    if (skip.includes(format(m))) continue;
    slots.push({ id: `slot-${m}`, start: format(m), stop: format(m + 5) });
  }

  return slots;
};

const starts = (times: { start: string }[]) => times.map((time) => time.start);

// Segmento de clínica da loja 152 (TP-4816).
const clinicSegment: PaShopConfigurationsSegment = {
  id: 606,
  type: ShopSegment.CLINIC,
  name: "Clínica",
  timeTable: {
    fullTime: false,
    monday: [{ start: "09:00", stop: "17:30" }],
    tuesday: [{ start: "09:00", stop: "17:30" }],
    wednesday: [{ start: "09:00", stop: "17:30" }],
    thursday: [{ start: "09:00", stop: "17:30" }],
    friday: [{ start: "09:00", stop: "17:30" }],
    saturday: [{ start: "09:00", stop: "13:00" }],
    sunday: [{ start: "09:00", stop: "13:00" }],
  },
};

const shopSettings = { segments: [clinicSegment] };

const nineAm: DisplayGridOrigin = { minutes: 9 * 60, source: "timeTable" };

describe("intervalMinutesByDisplayMode", () => {
  it("mapeia os modos de exibição para o passo da grade", () => {
    expect(
      intervalMinutesByDisplayMode(ChatbotTimeDisplayModeEnum.THIRTY_MIN),
    ).toBe(30);
    expect(
      intervalMinutesByDisplayMode(ChatbotTimeDisplayModeEnum.ONE_HOUR),
    ).toBe(60);
    expect(intervalMinutesByDisplayMode(ChatbotTimeDisplayModeEnum.ALL)).toBe(
      0,
    );
  });

  it("não afina quando o modo está vazio ou chega como a string 'null' do Typebot", () => {
    expect(intervalMinutesByDisplayMode("")).toBe(0);
    expect(intervalMinutesByDisplayMode("null")).toBe(0);
    expect(intervalMinutesByDisplayMode(undefined)).toBe(0);
  });
});

describe("resolveDisplayGridOrigin", () => {
  it("usa a abertura do segmento no dia da semana da data", () => {
    // 2026-10-04 é domingo.
    expect(
      resolveDisplayGridOrigin({
        shopSettings,
        segmentType: "CLINIC",
        dateISO: "2026-10-04",
      }),
    ).toEqual({ minutes: 9 * 60, source: "timeTable" });
  });

  it("com mais de um turno, conta da primeira abertura do dia", () => {
    const segment: PaShopConfigurationsSegment = {
      ...clinicSegment,
      timeTable: {
        ...(clinicSegment.timeTable as NonNullable<
          PaShopConfigurationsSegment["timeTable"]
        >),
        monday: [
          { start: "13:15", stop: "18:00" },
          { start: "08:00", stop: "12:00" },
        ],
      },
    };

    expect(
      resolveDisplayGridOrigin({
        shopSettings: { segments: [segment] },
        segmentType: "CLINIC",
        dateISO: "2026-10-05",
      }),
    ).toEqual({ minutes: 8 * 60, source: "timeTable" });
  });

  it("cai para a meia-noite sem configuração utilizável", () => {
    const midnight: DisplayGridOrigin = { minutes: 0, source: "midnight" };

    expect(
      resolveDisplayGridOrigin({
        shopSettings: undefined,
        segmentType: "CLINIC",
        dateISO: "2026-10-04",
      }),
    ).toEqual(midnight);

    expect(
      resolveDisplayGridOrigin({
        shopSettings,
        segmentType: "PET_SHOP",
        dateISO: "2026-10-04",
      }),
    ).toEqual(midnight);

    expect(
      resolveDisplayGridOrigin({
        shopSettings: {
          segments: [
            {
              ...clinicSegment,
              timeTable: {
                ...(clinicSegment.timeTable as NonNullable<
                  PaShopConfigurationsSegment["timeTable"]
                >),
                fullTime: true,
              },
            },
          ],
        },
        segmentType: "CLINIC",
        dateISO: "2026-10-04",
      }),
    ).toEqual(midnight);

    expect(
      resolveDisplayGridOrigin({
        shopSettings,
        segmentType: "CLINIC",
        dateISO: "data-invalida",
      }),
    ).toEqual(midnight);
  });
});

describe("filterByDisplayGrid", () => {
  it("print do lojista: 09:00 ocupado não desloca a grade para 09:05", () => {
    // availableTimes de 04/10 às 15:04 de 02/10 (09:00 ocupado por agendamentos).
    const times = slotsEvery5Min("09:05", "11:55");

    expect(starts(filterByDisplayGrid(times, 30, nineAm))).toEqual([
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("horário ocupado no meio do dia é pulado, não empurra os seguintes", () => {
    // 05/10 com 14:00 ocupado: antes saía 14:05, 14:35, 15:05 (#9797216).
    const times = slotsEvery5Min("13:00", "15:30", ["14:00"]);

    expect(starts(filterByDisplayGrid(times, 30, nineAm))).toEqual([
      "13:00",
      "13:30",
      "14:30",
      "15:00",
      "15:30",
    ]);
  });

  it("o corte da antecedência mínima arredonda para o próximo ponto da grade", () => {
    // Cliente às 11:20:xx com 24h de antecedência: o primeiro slot que sobra é
    // 11:25, que antes virava a âncora (#9790405, agendado às 14:55).
    const times = slotsEvery5Min("11:25", "15:00");

    expect(starts(filterByDisplayGrid(times, 30, nineAm))).toEqual([
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
    ]);
  });

  it("de hora em hora conta a partir da abertura, mesmo fora da hora cheia", () => {
    const times = slotsEvery5Min("08:30", "11:00");

    expect(
      starts(
        filterByDisplayGrid(times, 60, {
          minutes: 8 * 60 + 30,
          source: "timeTable",
        }),
      ),
    ).toEqual(["08:30", "09:30", "10:30"]);
  });

  it("sem afinar (modo ALL) devolve a lista intacta", () => {
    const times = slotsEvery5Min("09:05", "09:20");

    expect(filterByDisplayGrid(times, 0, nineAm)).toBe(times);
  });

  it("mantém horário com formato inesperado e não quebra com lista vazia", () => {
    const malformed = { id: "x", start: "sem-horario", stop: "" };

    expect(filterByDisplayGrid([malformed], 30, nineAm)).toEqual([malformed]);
    expect(filterByDisplayGrid([], 30, nineAm)).toEqual([]);
  });
});
