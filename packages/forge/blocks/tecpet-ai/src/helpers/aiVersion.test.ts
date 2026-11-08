import { describe, expect, it } from "bun:test";
import {
  aiBaseUrl,
  findChatbotSettings,
  isAiV2,
  loadAiSettings,
  parseJsonObject,
  resolveShopId,
} from "./aiVersion";

const chatbotSettings = (aiVersion: string) => ({
  id: "ff6ce324-43a3-445d-bb6c-57dc7faaa5f3",
  aiVersion,
  mode: "SIMULATION",
  chatbotActions: [{ id: "a1", name: "Agendar no banho e tosa" }],
  shop: { id: 3581, name: "Bianchivet" },
});

describe("parseJsonObject", () => {
  it("parses the JSON text Typebot stores for object variables", () => {
    expect(parseJsonObject(JSON.stringify({ aiVersion: "V2" }))).toEqual({
      aiVersion: "V2",
    });
  });

  it("keeps an object as it is", () => {
    const value = { id: 1 };
    expect(parseJsonObject(value)).toBe(value);
  });

  it("ignores arrays, plain text and broken JSON", () => {
    expect(parseJsonObject(["a"])).toBeUndefined();
    expect(parseJsonObject('["a"]')).toBeUndefined();
    expect(parseJsonObject("oi")).toBeUndefined();
    expect(parseJsonObject("{oi")).toBeUndefined();
    expect(parseJsonObject(null)).toBeUndefined();
  });
});

describe("isAiV2", () => {
  it("is true only for shops on the AI v2", () => {
    expect(isAiV2(chatbotSettings("V2"))).toBe(true);
    expect(isAiV2(chatbotSettings("V1"))).toBe(false);
    expect(isAiV2({ mode: "SELF_SERVICE" })).toBe(false);
    expect(isAiV2(undefined)).toBe(false);
  });
});

describe("findChatbotSettings", () => {
  it("finds the chatbot settings among the flow variables", () => {
    const variables = [
      { value: "oi" },
      { value: JSON.stringify({ id: 3581, name: "Bianchivet" }) },
      { value: ["Agendar no banho e tosa"] },
      { value: JSON.stringify(chatbotSettings("V2")) },
      { value: null },
    ];
    expect(isAiV2(findChatbotSettings(variables))).toBe(true);
  });

  it("returns nothing when no variable holds chatbot settings", () => {
    expect(
      findChatbotSettings([{ value: JSON.stringify({ aiVersion: "V2" }) }]),
    ).toBeUndefined();
    expect(findChatbotSettings([])).toBeUndefined();
  });
});

describe("resolveShopId", () => {
  it("prefers the shop option and falls back to the chatbot settings", () => {
    expect(resolveShopId({ id: 10 }, chatbotSettings("V2"))).toBe(10);
    expect(resolveShopId(undefined, chatbotSettings("V2"))).toBe(3581);
    expect(resolveShopId({ id: "3581" }, undefined)).toBe(3581);
  });

  it("returns nothing for a missing or invalid id", () => {
    expect(resolveShopId(undefined, undefined)).toBeUndefined();
    expect(resolveShopId({ id: "abc" }, undefined)).toBeUndefined();
    expect(resolveShopId({ id: 0 }, undefined)).toBeUndefined();
  });
});

describe("aiBaseUrl", () => {
  it("adds the v2 path only for shops on the AI v2", () => {
    expect(aiBaseUrl("http://tecpet-ai-service", true)).toBe(
      "http://tecpet-ai-service/v2",
    );
    expect(aiBaseUrl("http://tecpet-ai-service", false)).toBe(
      "http://tecpet-ai-service",
    );
  });
});

describe("loadAiSettings", () => {
  it("skips the request without a Public API key or a shop", async () => {
    expect(await loadAiSettings({}, 3581)).toBeUndefined();
    expect(
      await loadAiSettings({ publicApiKey: "key" }, undefined),
    ).toBeUndefined();
  });
});
