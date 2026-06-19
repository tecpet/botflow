import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
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
});

export const ChangeShopHandler = async ({
  credentials,
  options,
  logs,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  logs: LogsStore;
}) => {
  try {
    await ky
      .post(`${credentials.baseUrl as string}/session/changeShop`, {
        json: {
          sessionId: options.sessionId,
          shopId: options.shopId,
        },
        timeout: 30000,
      })
      .json<Record<string, unknown>>();
  } catch (error) {
    logs.add({
      status: "error",
      description: "Failed to change shop",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
