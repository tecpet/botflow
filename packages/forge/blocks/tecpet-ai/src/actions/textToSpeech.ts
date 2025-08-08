import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../constants";
import {auth} from "../auth";
import ky, {HTTPError} from "ky";
import {parseUnknownError} from "@typebot.io/lib/parseUnknownError";

export const textToSpeech = createAction({
  auth,
  baseOptions,
  name: "Criar audio",
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
    voiceType: option.string.layout({
      label: "Voz",
      isRequired: false,
      helperText: "Gênero da voz",
    }),
    saveTextInVariableId: option.string.layout({
      label: "Salvar URL do audio em",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({saveTextInVariableId}) =>
    saveTextInVariableId ? [saveTextInVariableId] : [],
  run: {
    server: async ({credentials, options, variables, logs}) => {
      try {
        console.log(options)
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
          .json<any>();
        if (options.saveTextInVariableId) {
          variables.set([{id: options.saveTextInVariableId, value: response.url}]);
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
