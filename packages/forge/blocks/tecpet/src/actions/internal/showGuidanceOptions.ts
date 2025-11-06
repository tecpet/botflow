import type {
  ChatbotGuidanceOptionDto,
  ChatbotGuidanceOptionTypeEnum,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";

export const guindanceOptionsTypeEnum: {
  [key in ChatbotGuidanceOptionTypeEnum]: string;
} = {
  NONE: "NONE",
  BACK_TO_HOME: "BACK_TO_HOME",
  BOOKING_CONFIRM: "BOOKING_CONFIRM",
  BOOKING_CANCEL: "BOOKING_CANCEL",
  BOOKING_RESCHEDULE: "BOOKING_RESCHEDULE",
  BOOKING_CREATE: "BOOKING_CREATE",
  REMEMBER_ME_LATER: "REMEMBER_ME_LATER",
  TRANSFER_TO_HUMAN: "TRANSFER_TO_HUMAN",
  PAY_INVOICE_WITH_VOUCHER: "PAY_INVOICE_WITH_VOUCHER",
  CALL: "CALL",
  URL: "URL",
  END: "END",
};

export const showGuidanceOptions = createAction({
  baseOptions,
  name: "Mostrar direcionamentos para o cliente",
  options: option.object({
    guidanceOptions: option.string.layout({
      label: "Direcionamento para o cliente",
      isRequired: true,
      helperText: "Menu",
    }),

    guidanceButtonTitles: option.string.layout({
      label: "Título do botão",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),

    guidanceButtonValues: option.string.layout({
      label: "Valor de direcionamento do botão",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ guidanceButtonTitles, guidanceButtonValues }) => {
    const variables = [];

    if (guidanceButtonTitles) variables.push(guidanceButtonTitles);
    if (guidanceButtonValues) variables.push(guidanceButtonValues);

    return variables;
  },
  run: {
    server: async ({ options, variables }) => {
      try {
        const parsedGuidanceOptions: string[] = JSON.parse(
          options.guidanceOptions as string,
        );

        const guidanceOptions: ChatbotGuidanceOptionDto[] =
          parsedGuidanceOptions.map((option) =>
            typeof option === "string" ? JSON.parse(option) : option,
          );

        variables.set([
          {
            id: options.guidanceButtonTitles as string,
            value: guidanceOptions
              .filter((option) => option.enabled)
              .map((option) => option.buttonTitle),
          },
          {
            id: options.guidanceButtonValues as string,
            value: guidanceOptions
              .filter((option) => option.enabled)
              .map((option) => option.guidanceType),
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
