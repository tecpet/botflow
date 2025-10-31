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
    actionMenuTitles: option.string.layout({
      label: "Menu de ação Inicial - Títulos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    actionMenuIds: option.string.layout({
      label: "Menu de ação Inicial - Valores",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    actionMenuDescriptions: option.string.layout({
      label: "Menu de ação Inicial - Descrições",
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
    chatbotTriggers: option.string.layout({
      label: "Disparos para escolher chatbot",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    chatbotActions: option.string.layout({
      label: "Açoes da configuração",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    voiceGenre: option.string.layout({
      label: "Gênero da voz",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    configurations,
    actionMenuTitles,
    actionMenuIds,
    actionMenuDescriptions,
    newClientMessage,
    registeredClientMessage,
    aiEnabled,
    aiPersonality,
    voiceResponseEnabled,
    chatbotTriggers,
    chatbotActions,
    voiceGenre,
  }) => {
    const variables = [];

    if (configurations) variables.push(configurations);
    if (actionMenuTitles) variables.push(actionMenuTitles);
    if (actionMenuIds) variables.push(actionMenuIds);
    if (actionMenuDescriptions) variables.push(actionMenuDescriptions);
    if (newClientMessage) variables.push(newClientMessage);
    if (registeredClientMessage) variables.push(registeredClientMessage);
    if (aiEnabled) variables.push(aiEnabled);
    if (aiPersonality) variables.push(aiPersonality);
    if (voiceResponseEnabled) variables.push(voiceResponseEnabled);
    if (chatbotTriggers) variables.push(chatbotTriggers);
    if (chatbotActions) variables.push(chatbotActions);
    if (voiceGenre) variables.push(voiceGenre);
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
            variables.set([
              { id: options.configurations as string, value: result },
              {
                id: options.actionMenuTitles as string,
                value: result.chatbotActions
                  .filter((a) => a.enabled)
                  .map((a) => a.name),
              },
              {
                id: options.actionMenuIds as string,
                value: result.chatbotActions
                  .filter((a) => a.enabled)
                  .map((a) => a),
              },
              {
                id: options.actionMenuDescriptions as string,
                value: result.chatbotActions
                  .filter((a) => a.enabled)
                  .map((a) => a.description),
              },
              {
                id: options.newClientMessage as string,
                value: result.newClientMessage,
              },
              {
                id: options.registeredClientMessage as string,
                value: result.registeredClientMessage,
              },
              { id: options.aiEnabled as string, value: result.aiEnabled },
              {
                id: options.aiPersonality as string,
                value: result.aiPersonality,
              },
              {
                id: options.voiceResponseEnabled as string,
                value: result.voiceResponseEnabled,
              },
              {
                id: options.chatbotTriggers as string,
                value: result.chatbotTriggers,
              },
              {
                id: options.chatbotActions as string,
                value: result.chatbotActions,
              },
              {
                id: options.voiceGenre as string,
                value: result.aiVoice,
              },
            ]);
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
