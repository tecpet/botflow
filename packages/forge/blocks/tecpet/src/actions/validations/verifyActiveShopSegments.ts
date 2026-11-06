import type {
  ChatbotActionJson,
  PaShopConfigurationsSegment,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../auth";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { parseJsonArray } from "../../helpers/utils";

export const verifyActiveShopSegments = createAction({
  auth,
  baseOptions,
  name: "Verificar Segmentos Ativos da Loja",
  options: option.object({
    shopSegments: option.string.layout({
      label: "Segmentos da loja",
      isRequired: true,
    }),
    chatbotActions: option.string.layout({
      label: "Ações do chatbot",
      isRequired: true,
    }),
    activeShopSegments: option.string.layout({
      label: "Segmentos ativos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ activeShopSegments }) => {
    const variables: string[] = [];

    if (activeShopSegments) variables.push(activeShopSegments);

    return variables;
  },
});

export const VerifyActiveShopSegmentsHandler = async ({
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const shopSegments = parseJsonArray<PaShopConfigurationsSegment>(
      options.shopSegments,
    );
    const chatbotActions = parseJsonArray<ChatbotActionJson>(
      options.chatbotActions,
    );

    // O `type` do segmento (ShopSegment) casa com o `actionType` da ação do
    // chatbot (ChatbotActionTypeEnum) — ambos compartilham PET_SHOP, CLINIC,
    // DAY_CARE e HOTEL. Mantém só os segmentos cuja ação correspondente está
    // habilitada, removendo da lista os segmentos sem oferta no chatbot.
    const activeActionTypes = new Set<string>(
      chatbotActions
        .filter((action) => action.enabled)
        .map((action) => action.actionType),
    );

    const activeShopSegments = shopSegments.filter((segment) =>
      activeActionTypes.has(segment.type),
    );

    logHandler("verifyActiveShopSegments", {
      totalSegments: shopSegments.length,
      activeActionTypes: summarizeArray([...activeActionTypes]),
      activeSegments: summarizeArray(
        activeShopSegments.map((s) => ({ type: s.type, name: s.name })),
      ),
    });

    variables.set([
      { id: options.activeShopSegments as string, value: activeShopSegments },
    ]);
  } catch (error) {
    console.error(error);
  }
};
