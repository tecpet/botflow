import {createAction, option} from "@typebot.io/forge";
import {baseOptions} from "../constants";
import {auth} from "../auth";

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
});
