import { createActionHandler } from "@typebot.io/forge";
import ky from "ky";
import { talkToAttendant } from "./actions/talkToAttendant";
import { endChat } from "./actions/endChat";
import { changeShop } from "./actions/changeShop";
import { ChatbotActionButtonTypeEnum } from "./enums/chatbot-action-button-type.enum";

export default [
  createActionHandler(talkToAttendant, {
    server: async ({ credentials, options, logs }) => {
      try {
        await ky
          .post(`${credentials.baseUrl}/action`, {
            json: {
              sessionId: options.sessionId,
              messsage: options.text ?? "Oi",
              action: ChatbotActionButtonTypeEnum.TRANSFER_TO_HUMAN,
            },
            timeout: 30000,
          })
          .json<Record<string, unknown>>();
      } catch (error) {
        logs.add({
          status: "error",
          description: "Failed to transfer to human attendant",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),
  createActionHandler(endChat, {
    server: async ({ credentials, options, logs }) => {
      try {
        await ky
          .post(`${credentials.baseUrl}/action`, {
            json: {
              sessionId: options.sessionId,
              messsage: options.text ?? "Oi",
              action: ChatbotActionButtonTypeEnum.END,
            },
            timeout: 30000,
          })
          .json<Record<string, unknown>>();
      } catch (error) {
        logs.add({
          status: "error",
          description: "Failed to end chat",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),
  createActionHandler(changeShop, {
    server: async ({ credentials, options, logs }) => {
      try {
        await ky
          .post(`${credentials.baseUrl}/session/changeShop`, {
            json: {
              sessionId: options.sessionId,
              shopId: options.shopId,
            },
            timeout: 30000,
          })
          .json<Record<string, unknown>>();
      } catch (error) {
        logs.add({
          status: "error",
          description: "Failed to change shop",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),
];

