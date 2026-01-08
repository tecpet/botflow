import {
  BookingGuardScopeEnum,
  type PaGetBookingGuardValidationBody,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../constants";
import { parseIds } from "../../helpers/utils";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";
import type { ServiceOptionType } from "../internal/buildServiceOptions";

export const verifyBookingGuard = createAction({
  auth,
  baseOptions,
  name: "Validar restrição de agenda",
  options: option.object({
    selectedTimeOption: option.string.layout({
      label: "Horário selecionado",
      isRequired: true,
      helperText: "Horário selecionado",
    }),
    servicesIds: option.string.layout({
      label: "Ids dos serviços disponiveis",
      isRequired: true,
      helperText: "Ids dos serviços disponiveis",
    }),
    selectedServices: option.string.layout({
      label: "Serviços selecionado",
      isRequired: true,
      helperText: "Serviços selecionado",
    }),
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    petId: option.number.layout({
      label: "Id do Pet",
      isRequired: true,
      helperText: "Id do pet",
    }),
    segmentType: option.string.layout({
      label: "Segmento",
      isRequired: true,
      helperText: "Segmento",
    }),
    bookingGuardMessage: option.string.layout({
      label: "Mensagem de agendamento bloqueado",
      isRequired: true,
      helperText: "Mensagem de bloqueio",
      inputType: "variableDropdown",
    }),
    isBookingBlocked: option.string.layout({
      label: "Agendamento bloqueado",
      isRequired: true,
      helperText: "Bloqueio de agendamento",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ bookingGuardMessage, isBookingBlocked }) => {
    const variables = [];

    if (bookingGuardMessage) variables.push(bookingGuardMessage);

    if (isBookingBlocked) variables.push(isBookingBlocked);

    return variables;
  },
});
export const VerifyBookingGuardHandler = async ({
  credentials, options, variables, logs
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs: any;
}) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const rawSelectedTimeOption = options.selectedTimeOption;

        const selectedTimeOption: AvailableTimeType = JSON.parse(
          rawSelectedTimeOption as string,
        );

        const parsedSelectedService: ServiceOptionType = JSON.parse(
          options.selectedServices as string,
        );

        const serviceIds = parseIds(options.servicesIds);

        const selectedId = Number(parsedSelectedService.id);

        const services = serviceIds.includes(selectedId) ? [selectedId] : [];

        const body: PaGetBookingGuardValidationBody = {
          petId: Number(options.petId),
          servicesId: services,
          date: selectedTimeOption.dateISO,
          segmentType: options.segmentType as ShopSegment,
          guardScopes: [BookingGuardScopeEnum.BOT, BookingGuardScopeEnum.BOTH],
        };

        const bookingGuardValidation = await tecpetSdk.bookingGuard.validation(
          body,
          Number(options.shopId),
        );

        variables.set([
          {
            id: options.isBookingBlocked as string,
            value: bookingGuardValidation?.blocked,
          },
        ]);

        variables.set([
          {
            id: options.bookingGuardMessage as string,
            value: bookingGuardValidation?.guard?.description ?? "",
          },
        ]);
      } catch (error) {
        console.error(error);
      }
};
