import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import ky from "ky";
import { auth } from "../auth";
import { baseOptions } from "../constants";
import { ChatbotActionButtonTypeEnum } from "../enums/chatbot-action-button-type.enum";

export const talkToAttendant = createAction({
  auth,
  baseOptions,
  name: "Conversar com atendente",
  options: option.object({
    sessionId: option.string.layout({
      label: "Id da sessão",
      isRequired: true,
    }),
    text: option.string.layout({
      label: "Texto",
      isRequired: false,
      helperText: "Iniciar conversa com o texto",
    }),
  }),
  getSetVariableIds: () => {
    return [];
  },
});

export const TalkToAttendantHandler = async ({
  credentials,
  options,
  logs,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  logs: LogsStore;
}) => {
  try {
    await ky
      .post(`${credentials.baseUrl as string}/action`, {
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
};
