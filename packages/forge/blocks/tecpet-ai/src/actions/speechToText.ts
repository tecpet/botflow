import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../constants";
import {auth} from "../auth";
import ky, {HTTPError} from "ky";
import {parseUnknownError} from "@typebot.io/lib/parseUnknownError";

export const speechToText = createAction({
  auth,
  baseOptions,
  name: "Converter audio",
  options: option.object({
    sessionId: option.string.layout({
      label: "Id da sessão",
      isRequired: true,
      helperText: "Id da sessão",
    }),
    audioUrl: option.string.layout({
      label: "URL do audio",
      isRequired: true,
      helperText: "Url do audio",
    }),
    saveTextInVariableId: option.string.layout({
      label: "Salvar texto em",
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
          .json<any>();
        if (options.saveTextInVariableId) {
          variables.set([{id: options.saveTextInVariableId, value: response.text}]);
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
