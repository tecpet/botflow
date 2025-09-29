import type {
  ChatbotSendingInfoItemDto,
  ChatbotSendingInfoItemTypeEnum,
  MediaDto,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const sendingInfoItemTypeLiteral: {
  [key in ChatbotSendingInfoItemTypeEnum]: string;
} = {
  AUDIO: "INFO_AUDIOS",
  DOCUMENT: "INFO_DOCUMENTOS",
  IMAGE: "INFO_IMAGENS",
  MESSAGE: "INFO_MENSAGEM",
  VIDEO: "INFO_VIDEOS",
};

export const showSendingInfoItems = createAction({
  baseOptions,
  name: "Mostrar item das informações para cliente",
  options: option.object({
    sendingInfoItems: option.string.layout({
      label: "Informações para o cliente",
      isRequired: true,
      helperText: "Menu",
    }),

    infoItem: option.string.layout({
      label: "Informação a ser mostrada para o cliente",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    infoGroup: option.string.layout({
      label: "Grupo de informação selecionado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    infoMedias: option.string.layout({
      label: "Mídias da informação selecionada",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ infoItem }) => {
    const variables = [];

    if (infoItem) variables.push(infoItem);

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        let infoItem: ChatbotSendingInfoItemDto | null = null;

        let infoGroup = "";

        let infoMedias: MediaDto[] = [];

        const rawSendingInfoItems: string[] = JSON.parse(
          options.sendingInfoItems as string,
        );

        const sendingInfoItem: ChatbotSendingInfoItemDto[] =
          rawSendingInfoItems.map((item) =>
            typeof item === "string" ? JSON.parse(item) : item,
          );

        if (sendingInfoItem.length > 0) {
          infoItem = sendingInfoItem[0];

          infoGroup = sendingInfoItemTypeLiteral[infoItem.type];

          infoMedias = infoItem.medias ?? [];
        }

        variables.set([{ id: options.infoGroup as string, value: infoGroup }]);
        variables.set([
          { id: options.infoMedias as string, value: infoMedias },
        ]);
        variables.set([{ id: options.infoItem as string, value: infoItem }]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
