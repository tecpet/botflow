import type {
  ChatbotActionJson,
  ChatbotTriggerJson,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const verifyInitialMessageToTrigger = createAction({
  baseOptions,
  name: "Verificar mensagem inicial do cliente",
  options: option.object({
    chatbotTriggers: option.string.layout({
      label: "Disparos do chatbot",
      isRequired: true,
    }),
    chatbotActions: option.string.layout({
      label: "Ações do chatbot",
      isRequired: true,
    }),
    initialClientMessage: option.string.layout({
      label: "Mensagem inicial do cliente",
      placeholder: "Selecione",
    }),
    menusAction: option.string.layout({
      label: "Menus de ação do chatbot",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    selectedActionMenu: option.string.layout({
      label: "Menu de ação selecionado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    chatbotTriggers,
    initialClientMessage,
    chatbotActions,
    menusAction,
    selectedActionMenu,
  }) => {
    const variables = [];

    if (menusAction) variables.push(menusAction);
    if (selectedActionMenu) variables.push(selectedActionMenu);
    if (chatbotActions) variables.push(chatbotActions);
    if (chatbotTriggers) variables.push(chatbotTriggers);
    if (initialClientMessage) variables.push(initialClientMessage);

    return variables;
  },
  run: {
    server: async ({ options, variables, logs }) => {
      try {
        const initialMessage = options.initialClientMessage as string;
        let chatbotActionId = null;
        let menusAction = null;
        let selectedActionMenu = null;

        const chatbotTriggersRaw: string[] = JSON.parse(
          options.chatbotTriggers as string,
        );

        const chatbotActionsRaw: string[] = JSON.parse(
          options.chatbotActions as string,
        );

        const chatbotActions: ChatbotActionJson[] = chatbotActionsRaw.map(
          (item) => (typeof item === "string" ? JSON.parse(item) : item),
        );

        const chatbotTriggers: ChatbotTriggerJson[] = chatbotTriggersRaw.map(
          (item) => (typeof item === "string" ? JSON.parse(item) : item),
        );

        for (const trigger of chatbotTriggers) {
          if (trigger.patternType === "EXACTLY_MATCH") {
            const matchString = initialMessage.match(
              buildExactMatchRegex(trigger.keyText),
            );
            if (matchString?.length && matchString?.length > 0) {
              chatbotActionId = trigger.chatbotAction.id;
              break;
            }
          }
          if (trigger.patternType === "CONTAIN_TEXT") {
            const matchString = initialMessage.match(
              buildLooseRegex(trigger.keyText),
            );
            if (matchString?.length && matchString?.length > 0) {
              chatbotActionId = trigger.chatbotAction.id;
              break;
            }
          }
        }

        if (chatbotActionId) {
          const action = chatbotActions.find(
            (action) => action.id === chatbotActionId,
          );

          menusAction = chatbotActions;
          selectedActionMenu = action;
        }

        variables.set([
          { id: options.menusAction as string, value: menusAction },
        ]);
        variables.set([
          {
            id: options.selectedActionMenu as string,
            value: selectedActionMenu,
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});

function removeSpecialCharsRegex(text: string) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function buildExactMatchRegex(target: string) {
  const text = removeSpecialCharsRegex(target);
  return new RegExp(`\\b${text}\\b`, "i"); // match exato, ignorando case
}

function buildLooseRegex(target: string) {
  const escaped = target
    .replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") // Escapar especiais
    .split("")
    .map((char) => `${char}\\s*`) // Permitir espaços entre caracteres
    .join("");
  return new RegExp(escaped, "i"); // Ignorar case
}
