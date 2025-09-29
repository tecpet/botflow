import { createAction, option } from "@typebot.io/forge";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import ky, { HTTPError } from "ky";
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
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const response = await ky
          .post(`${credentials.baseUrl}/start`, {
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: {
              sessionId: options.sessionId,
              message: options.text || "oi",
              shop: options.shop,
              client: options.client,
              chatbotSettings: options.chatbotSettings,
            },
            timeout: 30000,
          })
          .json<any>();

        if (options.saveResponseInVariableId) {
          variables.set([
            { id: options.saveResponseInVariableId, value: response.response },
          ]);
        }
      } catch (error) {
        console.error(error);

        if (error instanceof HTTPError)
          return logs.add(
            await parseUnknownError({
              err: error,
              context: "While searching Blink users",
            }),
          );
        console.error(error);
      }
    },
  },
});
