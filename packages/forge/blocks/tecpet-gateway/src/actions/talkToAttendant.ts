import { createAction, option } from "@typebot.io/forge";
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
