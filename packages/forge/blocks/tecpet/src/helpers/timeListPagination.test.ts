import { describe, expect, it } from "bun:test";
import { normalizeTimesPage, paginateTimes } from "./timeListPagination";

type Time = { id: string; dateISO: string; start: string };

/** `count` horários de 30 em 30 min a partir das 08:00. */
const dayTimes = (dateISO: string, count: number): Time[] =>
  Array.from({ length: count }, (_, index) => {
    const minutes = 8 * 60 + index * 30;
    const start = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

    return { id: `${dateISO} ${start}`, dateISO, start };
  });

const TODAY = "2026-10-21";
const TOMORROW = "2026-10-22";

const allPages = (times: Time[], maxTimes: number) => {
  const { pageCount } = paginateTimes(times, { maxTimes, page: 0 });

  return Array.from(
    { length: pageCount },
    (_, page) => paginateTimes(times, { maxTimes, page }).times,
  );
};

describe("paginateTimes", () => {
  it("lista que cabe vai inteira, sem página extra", () => {
    const times = [...dayTimes(TODAY, 4), ...dayTimes(TOMORROW, 5)];

    expect(paginateTimes(times, { maxTimes: 9, page: 0 })).toEqual({
      times,
      pageIndex: 0,
      pageCount: 1,
    });
  });

  it("divide a página entre os dias e espalha os horários pelo dia", () => {
    // 08:00–17:30 de 30 em 30 nos dois dias: 40 horários, 8 por página.
    const times = [...dayTimes(TODAY, 20), ...dayTimes(TOMORROW, 20)];

    const { times: firstPage, pageCount } = paginateTimes(times, {
      maxTimes: 9,
      page: 0,
    });

    expect(pageCount).toBe(5);
    expect(firstPage.map((time) => time.id)).toEqual([
      `${TODAY} 08:00`,
      `${TODAY} 10:30`,
      `${TODAY} 13:00`,
      `${TODAY} 15:30`,
      `${TOMORROW} 08:00`,
      `${TOMORROW} 10:30`,
      `${TOMORROW} 13:00`,
      `${TOMORROW} 15:30`,
    ]);
    expect(
      paginateTimes(times, { maxTimes: 9, page: 1 }).times.map(
        (time) => time.start,
      ),
    ).toEqual([
      "08:30",
      "11:00",
      "13:30",
      "16:00",
      "08:30",
      "11:00",
      "13:30",
      "16:00",
    ]);
  });

  it("dia com poucos horários aparece inteiro e cede a sobra para o outro", () => {
    const times = [...dayTimes(TODAY, 3), ...dayTimes(TOMORROW, 20)];

    const { times: firstPage } = paginateTimes(times, { maxTimes: 9, page: 0 });

    expect(firstPage.filter((time) => time.dateISO === TODAY)).toHaveLength(3);
    expect(firstPage.filter((time) => time.dateISO === TOMORROW)).toHaveLength(
      5,
    );
  });

  it("com número ímpar de linhas, o primeiro dia fica com a linha a mais", () => {
    const times = [...dayTimes(TODAY, 20), ...dayTimes(TOMORROW, 20)];

    const { times: firstPage } = paginateTimes(times, { maxTimes: 8, page: 0 });

    expect(firstPage.filter((time) => time.dateISO === TODAY)).toHaveLength(4);
    expect(firstPage.filter((time) => time.dateISO === TOMORROW)).toHaveLength(
      3,
    );
  });

  it("depois da última página volta para a primeira", () => {
    const times = [...dayTimes(TODAY, 20), ...dayTimes(TOMORROW, 20)];
    const first = paginateTimes(times, { maxTimes: 9, page: 0 });

    expect(paginateTimes(times, { maxTimes: 9, page: 5 })).toEqual(first);
    expect(paginateTimes(times, { maxTimes: 9, page: 12 }).pageIndex).toBe(2);
  });

  it("um dia só (o outro barrado) também pagina", () => {
    const times = dayTimes(TOMORROW, 12);
    const pages = allPages(times, 9);

    expect(pages.map((page) => page.length)).toEqual([6, 6]);
  });

  it.each([
    [0, 25, 9],
    [3, 20, 9],
    [9, 1, 9],
    [7, 9, 9],
    [16, 16, 9],
    [20, 20, 8],
    [11, 30, 7],
    [40, 0, 9],
  ])("hoje %p e amanhã %p com %p linhas: cada horário aparece em uma página só, em ordem", (todayCount, tomorrowCount, maxTimes) => {
    const times = [
      ...dayTimes(TODAY, todayCount),
      ...dayTimes(TOMORROW, tomorrowCount),
    ];
    const pages = allPages(times, maxTimes);
    const limit = pages.length > 1 ? maxTimes - 1 : maxTimes;

    for (const page of pages) {
      expect(page.length).toBeGreaterThan(0);
      expect(page.length).toBeLessThanOrEqual(limit);

      const ids = page.map((time) => time.id);
      expect(ids).toEqual([...ids].sort());
    }

    const listed = pages.flat().map((time) => time.id);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual(times.map((time) => time.id).sort());
  });
});

describe("normalizeTimesPage", () => {
  it.each([
    ["2", 2],
    [3, 3],
    ["", 0],
    ["null", 0],
    [undefined, 0],
    ["-1", 0],
    ["abc", 0],
  ])("%p vira a página %p", (raw, expected) => {
    expect(normalizeTimesPage(raw)).toBe(expected);
  });
});
