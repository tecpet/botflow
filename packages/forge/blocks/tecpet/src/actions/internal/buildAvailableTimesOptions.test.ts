import { describe, expect, it } from "bun:test";
import { BuildAvailableTimesOptionsHandler } from "./buildAvailableTimesOptions";

const times = [
  {
    id: "time-1",
    start: "10:30",
    stop: "11:10",
    dateISO: "2026-10-10",
    dateBR: "10/10/2026",
    scheduleStartTime: "10:30",
  },
];

/** Dois dias de 08:00 a 17:30, de 30 em 30 min: 40 horários. */
const fullWindow = ["2026-10-21", "2026-10-22"].flatMap((dateISO) =>
  Array.from({ length: 20 }, (_, index) => {
    const minutes = 8 * 60 + index * 30;
    const start = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const [year, month, day] = dateISO.split("-");

    return {
      id: `${dateISO} ${start}`,
      start,
      stop: start,
      dateISO,
      dateBR: `${day}/${month}/${year}`,
      scheduleStartTime: start,
    };
  }),
);

/** Roda o handler e devolve o que ele gravou, por id de variável. */
const run = async (
  extraOptions: Record<string, unknown> = {},
  availableTimes: unknown[] = times,
) => {
  const written = new Map<string, unknown>();

  await BuildAvailableTimesOptionsHandler({
    options: {
      availableTimes: JSON.stringify(availableTimes),
      availableTimesValues: "values",
      availableTimesStartAndStop: "titles",
      availableTimesDates: "dates",
      ...extraOptions,
    },
    variables: {
      set: (values: { id: string; value: unknown }[]) =>
        values.forEach(({ id, value }) => written.set(id, value)),
    },
  });

  return {
    titles: written.get("titles") as string[],
    ids: (written.get("values") as { id: string }[]).map((t) => t.id),
    dates: written.get("dates") as string[],
  };
};

describe("BuildAvailableTimesOptionsHandler", () => {
  it("sem a opção de outros profissionais, termina em PREFIRO OUTRA DATA", async () => {
    const { titles, ids } = await run();

    expect(titles).toEqual(["Dia 10/10 ás 10:30", "PREFIRO OUTRA DATA"]);
    expect(ids).toEqual(["time-1", "OTHER"]);
  });

  it("com a opção ligada, VER OUTROS PROFISSIONAIS vem logo abaixo de PREFIRO OUTRA DATA", async () => {
    // TP-5050: o Typebot injeta a variável booleana como a string "true".
    const { titles, ids } = await run({ showOtherEmployeesOption: "true" });

    expect(titles).toEqual([
      "Dia 10/10 ás 10:30",
      "PREFIRO OUTRA DATA",
      "VER OUTROS PROFISSIONAIS",
    ]);
    expect(ids).toEqual(["time-1", "OTHER", "OTHER_EMPLOYEES"]);
  });

  it("o rótulo cabe no título de linha da lista do WhatsApp (24 caracteres)", async () => {
    const { titles } = await run({ showOtherEmployeesOption: "true" });

    expect(titles.at(-1)?.length).toBeLessThanOrEqual(24);
  });

  it.each([
    ["false"],
    [""],
    [undefined],
    ["null"],
  ])("valor %p não mostra a opção", async (value) => {
    const { ids } = await run({ showOtherEmployeesOption: value });

    expect(ids).not.toContain("OTHER_EMPLOYEES");
  });
});

const SMART = { timeSelectionBehaviorTimeDisplayMode: "SMART" };

describe("BuildAvailableTimesOptionsHandler no modo de exibição SMART", () => {
  it.each([
    ["THIRTY_MIN"],
    ["ONE_HOUR"],
    ["ALL"],
    [""],
    [undefined],
  ])("no modo %p a lista vai inteira, como antes", async (mode) => {
    const { ids } = await run(
      { timeSelectionBehaviorTimeDisplayMode: mode },
      fullWindow,
    );

    expect(ids).toHaveLength(41);
    expect(ids).not.toContain("MORE_TIMES");
  });

  it("mostra 8 horários dos dois dias, VER MAIS HORÁRIOS e PREFIRO OUTRA DATA", async () => {
    const { titles, ids } = await run(SMART, fullWindow);

    expect(titles).toEqual([
      "Dia 21/10 ás 08:00",
      "Dia 21/10 ás 10:30",
      "Dia 21/10 ás 13:00",
      "Dia 21/10 ás 15:30",
      "Dia 22/10 ás 08:00",
      "Dia 22/10 ás 10:30",
      "Dia 22/10 ás 13:00",
      "Dia 22/10 ás 15:30",
      "VER MAIS HORÁRIOS",
      "PREFIRO OUTRA DATA",
    ]);
    expect(ids.slice(-2)).toEqual(["MORE_TIMES", "OTHER"]);
    expect(titles.every((title) => title.length <= 24)).toBe(true);
  });

  it("com VER OUTROS PROFISSIONAIS a lista continua em 10 linhas", async () => {
    const { ids } = await run(
      { ...SMART, showOtherEmployeesOption: "true" },
      fullWindow,
    );

    expect(ids).toHaveLength(10);
    expect(ids.slice(-3)).toEqual(["MORE_TIMES", "OTHER", "OTHER_EMPLOYEES"]);
  });

  it("a página seguinte traz outros horários, com títulos, valores e datas alinhados", async () => {
    const first = await run({ ...SMART, timesPage: "0" }, fullWindow);
    const second = await run({ ...SMART, timesPage: "1" }, fullWindow);

    const firstTimes = first.ids.slice(0, -2);
    const secondTimes = second.ids.slice(0, -2);

    expect(secondTimes).toHaveLength(8);
    expect(secondTimes.some((id) => firstTimes.includes(id))).toBe(false);
    expect(second.titles[0]).toBe("Dia 21/10 ás 08:30");
    expect(second.dates[0]).toBe("21/10");
    expect(second.titles).toHaveLength(second.ids.length);
    expect(second.dates).toHaveLength(second.ids.length);
  });

  it("quando tudo cabe nas 10 linhas, não oferece VER MAIS HORÁRIOS", async () => {
    const { ids } = await run(SMART, fullWindow.slice(0, 9));

    expect(ids).toHaveLength(10);
    expect(ids).not.toContain("MORE_TIMES");
  });
});
