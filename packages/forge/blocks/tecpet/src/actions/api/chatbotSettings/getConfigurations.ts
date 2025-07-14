import { type PaChatbotSettingsResponse, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";

export const getConfigurations = createAction({
  auth,
  baseOptions,
  name: "Configurações",
  options: option.object({
    shopId: option.number.layout({
      label: "ID Loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    configurations: option.string.layout({
      label: "Configurações",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menu: option.string.layout({
      label: "Menu Inicial",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menuTitles: option.string.layout({
      label: "Menu Inicial - Títulos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menuIds: option.string.layout({
      label: "Menu Inicial - Ids",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    menuDescriptions: option.string.layout({
      label: "Menu Inicial - Descrições",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    newClientMessage: option.string.layout({
      label: "Mensagem Inicial para novo cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    registeredClientMessage: option.string.layout({
      label: "Mensagem Inicial para cliente antigo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    aiEnabled: option.string.layout({
      label: "Atendimento por IA habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    aiPersonality: option.string.layout({
      label: "Personalidade da IA",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    voiceResponseEnabled: option.string.layout({
      label: "Agendamento por voz habilitado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    configurations,
    menu,
    menuTitles,
    menuIds,
    menuDescriptions,
    newClientMessage,
    registeredClientMessage,
    aiEnabled,
    aiPersonality,
    voiceResponseEnabled,
  }) => {
    const variables = [];
    if (configurations) variables.push(configurations);
    if (menu) variables.push(menu);
    if (menuTitles) variables.push(menuTitles);
    if (menuIds) variables.push(menuIds);
    if (menuDescriptions) variables.push(menuDescriptions);
    if (newClientMessage) variables.push(newClientMessage);
    if (registeredClientMessage) variables.push(registeredClientMessage);
    if (aiEnabled) variables.push(aiEnabled);
    if (aiPersonality) variables.push(aiPersonality);
    if (voiceResponseEnabled) variables.push(voiceResponseEnabled);
    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        if (options.shopId) {
          const tecpetSdk = new TecpetSDK(
            credentials.baseUrl ?? tecpetDefaultBaseUrl,
            credentials.apiKey,
          );
          const result: PaChatbotSettingsResponse =
            (await tecpetSdk.chatbot.getByShop(
              options.shopId,
            )) as PaChatbotSettingsResponse;
          if (result) {
            const variablesToSet = [
              { id: options.configurations, value: result },
              {
                id: options.menu,
                value: result.chatbotActions.filter((a) => a.enabled),
              },
              {
                id: options.menuTitles,
                value: result.chatbotActions
                  .filter((a) => a.enabled)
                  .map((a) => a.name),
              },
              {
                id: options.menuIds,
                value: result.chatbotActions
                  .filter((a) => a.enabled)
                  .map((a) => a.id),
              },
              {
                id: options.menuDescriptions,
                value: result.chatbotActions
                  .filter((a) => a.enabled)
                  .map((a) => a.description),
              },
              { id: options.newClientMessage, value: result.newClientMessage },
              { id: options.aiEnabled, value: result.aiEnabled },
              { id: options.aiPersonality, value: result.aiPersonality },
              {
                id: options.voiceResponseEnabled,
                value: result.voiceResponseEnabled,
              },
            ];

            variablesToSet.forEach(({ id, value }) => {
              if (id !== undefined) {
                variables.set([{ id, value }]);
              }
            });
          }
        }
      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
