import { createAction, option } from "@typebot.io/forge";
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
  run: {
    server: async ({ credentials, options, variables, logs }) => {
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
          .json<any>();
      } catch (error) {}
    },
  },
});
