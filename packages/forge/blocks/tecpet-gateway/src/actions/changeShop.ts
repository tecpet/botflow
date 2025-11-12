import { createAction, option } from "@typebot.io/forge";
import ky from "ky";
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
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        await ky
          .post(`${credentials.baseUrl}/action`, {
            json: {
              sessionId: options.sessionId,
              shopId: options.shopId,
            },
            timeout: 30000,
          })
          .json<any>();
      } catch (error: any) {
        logs.add({
          status: "error",
          description: `Failed to change shop`,
          details: `${error?.message}`,
        });
      }
    },
  },
});
