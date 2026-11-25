import { createActionHandler } from "@typebot.io/forge";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import ky, { HTTPError } from "ky";
import { continueChat } from "./actions/continueChat";
import { speechToText } from "./actions/speechToText";
import { startChat } from "./actions/startChat";
import { textToSpeech } from "./actions/textToSpeech";
import {
  aiBaseUrl,
  findChatbotSettings,
  isAiV2,
  loadAiSettings,
  parseJsonObject,
  resolveShopId,
} from "./helpers/aiVersion";

export default [
  createActionHandler(startChat, {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const chatbotSettings = parseJsonObject(options.chatbotSettings);
        const v2 = isAiV2(chatbotSettings);
        const shopId = resolveShopId(
          parseJsonObject(options.shop),
          chatbotSettings,
        );
        const iaSettings = v2
          ? await loadAiSettings(credentials, shopId)
          : undefined;

        if (v2 && !iaSettings)
          logs.add({
            status: "error",
            description: `AI v2 settings not loaded for shop ${shopId ?? "unknown"}`,
            details:
              "Fill the Public API key in the tecpet-ai credentials. Without it the AI v2 runs with its default settings.",
            context: "While starting chat with Tecpet AI",
          });

        const response = await ky
          .post(`${aiBaseUrl(credentials.baseUrl, v2)}/start`, {
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: {
              sessionId: options.sessionId,
              message: options.text || "oi",
              shop: options.shop,
              client: options.client,
              chatbotSettings: options.chatbotSettings,
              ...(iaSettings && { iaSettings }),
            },
            timeout: 10 * 60000,
          })
          .json<Record<string, unknown>>();

        if (options.saveResponseInVariableId) {
          variables.set([
            { id: options.saveResponseInVariableId, value: response.response },
          ]);
        }
      } catch (error) {
        if (error instanceof HTTPError)
          return logs.add(
            await parseUnknownError({
              err: error,
              context: "While starting chat with Tecpet AI",
            }),
          );
        logs.add(
          await parseUnknownError({
            err: error,
            context: "While starting chat with Tecpet AI",
          }),
        );
      }
    },
  }),
  createActionHandler(continueChat, {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const v2 = isAiV2(findChatbotSettings(variables.list()));
        const response = await ky
          .post(`${aiBaseUrl(credentials.baseUrl, v2)}/continue`, {
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: {
              sessionId: options.sessionId,
              message: options.text || "oi",
            },
            timeout: 10 * 60000,
          })
          .json<Record<string, unknown>>();

        if (options.saveResponseInVariableId) {
          variables.set([
            { id: options.saveResponseInVariableId, value: response.response },
          ]);
        }
        if (options.saveActionInVariableId) {
          variables.set([
            {
              id: options.saveActionInVariableId,
              value: response?.action || "NONE",
            },
          ]);
        }
      } catch (error) {
        if (error instanceof HTTPError)
          return logs.add(
            await parseUnknownError({
              err: error,
              context: "While continuing chat with Tecpet AI",
            }),
          );
        logs.add(
          await parseUnknownError({
            err: error,
            context: "While continuing chat with Tecpet AI",
          }),
        );
      }
    },
  }),
  createActionHandler(speechToText, {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const response = await ky
          .post(`${credentials.baseUrl}/speechToText`, {
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: {
              sessionId: options.sessionId,
              audioUrl: options.audioUrl,
            },
            timeout: 10 * 60000,
          })
          .json<Record<string, unknown>>();

        if (options.saveTextInVariableId) {
          variables.set([
            { id: options.saveTextInVariableId, value: response.text },
          ]);
        }
      } catch (error) {
        if (error instanceof HTTPError)
          return logs.add(
            await parseUnknownError({
              err: error,
              context: "While converting speech to text with Tecpet AI",
            }),
          );
        logs.add(
          await parseUnknownError({
            err: error,
            context: "While converting speech to text with Tecpet AI",
          }),
        );
      }
    },
  }),
  createActionHandler(textToSpeech, {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const response = await ky
          .post(`${credentials.baseUrl}/textToSpeech`, {
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: {
              sessionId: options.sessionId,
              text: options.text,
              voiceType: options?.voiceType,
            },
            timeout: 10 * 60000,
          })
          .json<Record<string, unknown>>();

        if (options.saveTextInVariableId) {
          variables.set([
            { id: options.saveTextInVariableId, value: response.url },
          ]);
        }
      } catch (error) {
        if (error instanceof HTTPError)
          return logs.add(
            await parseUnknownError({
              err: error,
              context: "While converting text to speech with Tecpet AI",
            }),
          );
        logs.add(
          await parseUnknownError({
            err: error,
            context: "While converting text to speech with Tecpet AI",
          }),
        );
      }
    },
  }),
];
