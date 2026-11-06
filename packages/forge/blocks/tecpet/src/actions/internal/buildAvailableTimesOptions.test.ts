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

/** Roda o handler e devolve o que ele gravou, por id de variável. */
const run = async (extraOptions: Record<string, unknown> = {}) => {
  const written = new Map<string, unknown>();

  await BuildAvailableTimesOptionsHandler({
    options: {
      availableTimes: JSON.stringify(times),
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
