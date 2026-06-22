import type {
  PaShopConfigurationsSegment,
  PaShopConfigurationsTimeTable,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";

type DayKey = keyof Omit<PaShopConfigurationsTimeTable, "fullTime">;

const isShopOpenNow = (
  timeTable: PaShopConfigurationsTimeTable,
  timeZone?: string,
): boolean => {
  if (timeTable.fullTime) return true;

  const tz = timeZone ?? "UTC";
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const dayKey = parts
    .find((p) => p.type === "weekday")
    ?.value.toLowerCase() as DayKey;

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const currentMinutes = hour * 60 + minute;

  const ranges = timeTable[dayKey];

  if (!ranges || ranges.length === 0) return false;

  return ranges.some((range) => {
    const [startH, startM] = range.start.split(":").map(Number);
    const [stopH, stopM] = range.stop.split(":").map(Number);
    return (
      currentMinutes >= startH * 60 + startM &&
      currentMinutes < stopH * 60 + stopM
    );
  });
};

export const verifyShopTimeTable = createAction({
  auth,
  baseOptions,
  name: "Verificar Tabela de Horário da Loja",
  options: option.object({
    shopSegments: option.string.layout({
      label: "Segmentos da loja",
      isRequired: true,
    }),
    timeZone: option.string.layout({
      label: "Fuso horário da loja",
      placeholder: "Ex: America/Sao_Paulo",
    }),
    segment: option.string.layout({
      label: "Segmento",
      isRequired: true,
    }),
    isOpen: option.string.layout({
      label: "Loja aberta?",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ isOpen }) => {
    const variables: string[] = [];

    if (isOpen) variables.push(isOpen);

    return variables;
  },
});

export const VerifyShopTimeTableHandler = async ({
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const rawShopSegments = options.shopSegments as string;
    const segment = options.segment as string;
    const timeZone = (options.timeZone as string | undefined) || "UTC";

    const parsed: unknown[] = JSON.parse(rawShopSegments);
    const shopSegments: PaShopConfigurationsSegment[] = parsed.map((s) =>
      typeof s === "string" ? JSON.parse(s) : s,
    );

    logHandler("verifyShopTimeTable", { segment, timeZone, shopSegments: summarizeArray(shopSegments.map((s) => ({ type: s.type, name: s.name }))) });

    const matchedSegment = shopSegments.find(
      (s) => s.type === segment || s.name === segment,
    );

    let open = false;

    if (matchedSegment) {
      const { timeTable } = matchedSegment;
      open = !timeTable || isShopOpenNow(timeTable, timeZone);
    }

    logHandler("verifyShopTimeTable", { matchedSegment: matchedSegment ? { type: matchedSegment.type, name: matchedSegment.name } : null, hasTimeTable: Boolean(matchedSegment?.timeTable), open });

    variables.set([{ id: options.isOpen, value: open }]);
  } catch (error) {
    console.error(error);
  }
};
