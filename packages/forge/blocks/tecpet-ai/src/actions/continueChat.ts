import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../constants";
import {auth} from "../auth";
import ky, {HTTPError} from "ky";
import {parseUnknownError} from "@typebot.io/lib/parseUnknownError";

export const continueChat = createAction({
  auth,
  baseOptions,
  name: "Continuar conversa",
  options: option.object({
    sessionId: option.string.layout({
      label: "Id da sessão",
      isRequired: true,
      helperText: "Id da sessão",
    }),
    text: option.string.layout({
      label: "Texto",
      isRequired: true,
      helperText: "Texto",
    }),
    saveResponseInVariableId: option.string.layout({
      label: "Salvar resposta em",
      inputType: "variableDropdown",
    }),
    saveActionInVariableId: option.string.layout({
      label: "Salvar ação em",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({saveResponseInVariableId, saveActionInVariableId}) => {
    const variables = [];
    if (saveResponseInVariableId) variables.push(saveResponseInVariableId);
    if (saveActionInVariableId) variables.push(saveActionInVariableId);
    return variables;
  },
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        const response = await ky
          .post(`${credentials.baseUrl}/continue`, {
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: {
              sessionId: options.sessionId,
              message: options.text || 'oi',
            },
            timeout: 10 * 60000,
          })
          .json<any>();

        if (options.saveResponseInVariableId) {
          variables.set([{id: options.saveResponseInVariableId, value: response.response}]);
        }
        if (options.saveActionInVariableId) {
          variables.set([{id: options.saveActionInVariableId, value: response?.action || 'NONE'}]);
        }
      } catch (error) {
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
