import {
  ChatbotAiVersionEnum,
  type PaAISettingsResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { tecpetAiV2Path, tecpetPublicApiDefaultBaseUrl } from "../constants";

type JsonObject = Record<string, unknown>;

type PublicApiCredentials = {
  publicApiBaseUrl?: string;
  publicApiKey?: string;
};

export const parseJsonObject = (value: unknown): JsonObject | undefined => {
  if (value && typeof value === "object" && !Array.isArray(value))
    return value as JsonObject;
  if (typeof value !== "string" || !value.trimStart().startsWith("{"))
    return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : undefined;
  } catch {
    return undefined;
  }
};

export const isAiV2 = (chatbotSettings: JsonObject | undefined): boolean =>
  chatbotSettings?.aiVersion === ChatbotAiVersionEnum.V2;

const isChatbotSettings = (value: JsonObject | undefined): boolean =>
  typeof value?.aiVersion === "string" && Array.isArray(value.chatbotActions);

export const findChatbotSettings = (
  variables: { value?: unknown }[],
): JsonObject | undefined =>
  variables
    .map((variable) => parseJsonObject(variable.value))
    .find(isChatbotSettings);

export const resolveShopId = (
  shop: JsonObject | undefined,
  chatbotSettings: JsonObject | undefined,
): number | undefined => {
  const shopId = Number(shop?.id ?? parseJsonObject(chatbotSettings?.shop)?.id);
  return Number.isInteger(shopId) && shopId > 0 ? shopId : undefined;
};

export const aiBaseUrl = (baseUrl: string, v2: boolean): string =>
  v2 ? `${baseUrl}${tecpetAiV2Path}` : baseUrl;

export const loadAiSettings = async (
  credentials: PublicApiCredentials,
  shopId: number | undefined,
): Promise<PaAISettingsResponse | undefined> => {
  if (!credentials.publicApiKey || !shopId) return undefined;
  try {
    const sdk = new TecpetSDK(
      credentials.publicApiBaseUrl ?? tecpetPublicApiDefaultBaseUrl,
      credentials.publicApiKey,
    );
    return (await sdk.aiSettings.get(shopId)) ?? undefined;
  } catch {
    return undefined;
  }
};
