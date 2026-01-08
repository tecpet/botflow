import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../constants";
import {auth} from "../auth";

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
});
