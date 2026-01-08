import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";
import { baseOptions } from "../constants";

export const changeShop = createAction({
  auth,
  baseOptions,
  name: "Alterar Loja da Rede",
  options: option.object({
    sessionId: option.string.layout({
      label: "Id da sessão",
      isRequired: true,
    }),
    shopId: option.number.layout({
      label: "Id da Loja",
      isRequired: true,
      helperText: "Id da nova loja",
    }),
  }),
  getSetVariableIds: () => {
    return [];
  },
});
