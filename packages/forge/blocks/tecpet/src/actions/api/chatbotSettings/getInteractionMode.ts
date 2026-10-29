import { type PaGetInteractionModeResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler } from "../../../helpers/logger";

export const getInteractionMode = createAction({
  auth,
  baseOptions,
  name: "Modo de Interação",
  options: option.object({
    shopId: option.number.layout({
      label: "ID Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    aiInteractionEnabled: option.string.layout({
      label: "IA habilitada",
      placeholder: "Selecione",
      helperText:
        "Recebe true quando o módulo AI_INTERACTION está ativo — use para redirecionar o fluxo para a IA",
      inputType: "variableDropdown",
    }),
    activeModule: option.string.layout({
      label: "Módulo ativo",
      placeholder: "Selecione",
      helperText: "Recebe AI_INTERACTION, CHATBOT_INTERACTION ou vazio",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ aiInteractionEnabled, activeModule }) => {
    const variables = [];
    if (aiInteractionEnabled) variables.push(aiInteractionEnabled);
    if (activeModule) variables.push(activeModule);
    return variables;
  },
});

export const GetInteractionModeHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    logHandler("getInteractionMode", { shopId: options.shopId });
    if (!options.shopId) return;

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const result: PaGetInteractionModeResponse =
      await tecpetSdk.chatbot.getInteractionMode(options.shopId as number);

    if (!result) return;

    logHandler("getInteractionMode", {
      aiInteractionEnabled: result.aiInteractionEnabled,
      activeModule: result.activeModule,
    });

    variables.set([
      {
        id: options.aiInteractionEnabled as string,
        value: result.aiInteractionEnabled,
      },
      { id: options.activeModule as string, value: result.activeModule },
    ]);
  } catch (error) {
    logHandler("getInteractionMode", { error: String(error) });
  }
};
