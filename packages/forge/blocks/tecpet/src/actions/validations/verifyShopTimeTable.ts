import type {
  PaShopConfigurationsSegment,
  PaShopConfigurationsTimeTable,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../auth";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";

type DayKey = keyof Omit<PaShopConfigurationsTimeTable, "fullTime">;

// `segment` recebe um ChatbotActionTypeEnum. Os tipos PET_SHOP/CLINIC/DAY_CARE/
// HOTEL casam com o `type` do segmento da loja, mas BOOKING (fluxo "Meus
// agendamentos") não é um segmento — nesse caso o segmento vem do serviço do
// agendamento selecionado (Segmento.Servico).
const BOOKING_ACTION_TYPE = "BOOKING";

// O Segmento.Servico pode chegar de várias formas dependendo de como o fluxo
// preenche a variável: string crua ("PET_SHOP"), o JSON do agendamento/serviço
// selecionado (`segmentType`/`segment`/`type`) ou uma lista deles.
const extractSegmentType = (raw: unknown): string | undefined => {
  if (raw === null || raw === undefined || raw === "") return undefined;

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    if (!trimmed) return undefined;

    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return trimmed;

    try {
      return extractSegmentType(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const found = extractSegmentType(item);

      if (found) return found;
    }

    return undefined;
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    return (
      extractSegmentType(obj.segmentType) ??
      extractSegmentType(obj.segment) ??
      extractSegmentType(obj.type)
    );
  }

  return undefined;
};

const toMinutes = (time: string): number => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const isShopOpenNow = (
  timeTable: PaShopConfigurationsTimeTable,
  timeZone?: string,
): boolean => {
  if (timeTable.fullTime) return true;

  const tz = timeZone ?? "America/Sao_Paulo";
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

  // Considera apenas o primeiro e o último horário do dia, ignorando os
  // intervalos (ex.: almoço). A loja só é considerada fechada quando o horário
  // atual está antes da abertura ou depois do fechamento.
  const opening = Math.min(...ranges.map((range) => toMinutes(range.start)));
  const closing = Math.max(...ranges.map((range) => toMinutes(range.stop)));

  return currentMinutes >= opening && currentMinutes < closing;
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
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    segment: option.string.layout({
      label: "Segmento",
      isRequired: true,
    }),
    serviceSegment: option.string.layout({
      label: "Segmento do serviço",
      isRequired: false,
      helperText:
        "Usado apenas quando o segmento for BOOKING (fluxo Meus agendamentos): segmento do serviço do agendamento selecionado (Segmento.Servico).",
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
    const rawShopSettings = options.shopSettings as string | undefined;
    const segment = options.segment as string;

    const parsed: unknown[] = JSON.parse(rawShopSegments);
    const shopSegments: PaShopConfigurationsSegment[] = parsed.map((s) =>
      typeof s === "string" ? JSON.parse(s) : s,
    );

    let shopSettings: { timeZone?: string } | undefined;
    try {
      shopSettings =
        typeof rawShopSettings === "string"
          ? JSON.parse(rawShopSettings)
          : (rawShopSettings as { timeZone?: string } | undefined);
    } catch (parseError) {
      console.error("[verifyShopTimeTable] falha ao parsear shopSettings", {
        rawShopSettings,
        parseError,
      });
    }

    // O config da loja expõe o fuso como `timeZone` (Z maiúsculo). Quando
    // ausente, usa o fuso padrão das lojas — nunca "UTC", que deslocaria o
    // horário atual em ~3h e marcaria a loja como fechada dentro do expediente.
    const timeZone = shopSettings?.timeZone ?? "America/Sao_Paulo";

    // Validação extra: no fluxo "Meus agendamentos" o `segment` chega como
    // BOOKING, que não corresponde a nenhum segmento da loja. Aí o segmento a
    // considerar é o do serviço do agendamento selecionado (Segmento.Servico),
    // usado somente nesse caso.
    const isBookingAction = segment === BOOKING_ACTION_TYPE;
    const serviceSegment = isBookingAction
      ? extractSegmentType(options.serviceSegment)
      : undefined;

    // Com BOOKING sem Segmento.Servico preenchido não há como casar o segmento;
    // cai no primeiro segmento da loja (mesmo fallback do segmento vazio) para
    // não marcar a loja como fechada dentro do expediente.
    const segmentToMatch = isBookingAction ? (serviceSegment ?? "") : segment;

    logHandler("verifyShopTimeTable", {
      segment: segment || null,
      isBookingAction,
      serviceSegment: serviceSegment ?? null,
      segmentToMatch: segmentToMatch || null,
      timeZone,
      shopSegments: summarizeArray(
        shopSegments.map((s) => ({ type: s.type, name: s.name })),
      ),
    });

    // Se um segmento foi informado, casa por tipo/nome. Caso contrário, usa o
    // primeiro segmento da loja (shopSegments[0]): quando a loja tem apenas um
    // segmento, a etapa de seleção de segmento é pulada e `segment` chega vazio,
    // o que antes resultava em matchedSegment=null → open=false (mostrando "fora
    // do horário comercial" mesmo dentro do expediente/intervalo de almoço).
    const matchedSegment = segmentToMatch
      ? shopSegments.find(
          (s) => s.type === segmentToMatch || s.name === segmentToMatch,
        )
      : shopSegments[0];

    let open = false;

    if (matchedSegment) {
      const { timeTable } = matchedSegment;

      open = !timeTable || isShopOpenNow(timeTable, timeZone);
    }

    logHandler("verifyShopTimeTable", {
      usedFirstSegment: !segmentToMatch,
      usedServiceSegment: Boolean(serviceSegment),
      matchedSegment: matchedSegment
        ? { type: matchedSegment.type, name: matchedSegment.name }
        : null,
      hasTimeTable: Boolean(matchedSegment?.timeTable),
      open,
    });

    variables.set([{ id: options.isOpen, value: open }]);
  } catch (error) {
    console.error(error);
  }
};
