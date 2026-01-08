import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";
import { baseOptions } from "../constants";

export const startChat = createAction({
  auth,
  baseOptions,
  name: "Iniciar conversa",
  options: option.object({
    sessionId: option.string.layout({
      label: "Id da sessão",
      isRequired: true,
    }),
    text: option.string.layout({
      label: "Texto",
      isRequired: true,
      helperText: "Iniciar conversa com o texto",
    }),
    client: option.string.layout({
      label: "Cliente",
      isRequired: true,
      helperText: "Informações sobre o cliente",
    }),
    chatbotSettings: option.string.layout({
      accordion: "Configurações",
      label: "Chatbot",
      moreInfoTooltip: "Configurações do chatbot...",
    }),
    shop: option.string.layout({
      accordion: "Configurações",
      label: "Loja",
      moreInfoTooltip: "Nome, segmentos...",
    }),
    saveResponseInVariableId: option.string.layout({
      label: "Salvar resposta em",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ saveResponseInVariableId }) =>
    saveResponseInVariableId ? [saveResponseInVariableId] : [],
});
