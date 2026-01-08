import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";
import { baseOptions } from "../constants";

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
  getSetVariableIds: ({ saveTextInVariableId }) =>
    saveTextInVariableId ? [saveTextInVariableId] : [],
});
