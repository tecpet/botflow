import {
  type PaGetBookingGuardValidationBody,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { auth } from "../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../constants";
import { describeApiError } from "../../helpers/apiErrors";
import {
  BOT_GUARD_SCOPES,
  buildGuardServiceIds,
} from "../../helpers/bookingGuard";
import { logHandler, summarizeArray } from "../../helpers/logger";
import {
  extractTakeAndBringId,
  parseIds,
  safeJsonParse,
} from "../../helpers/utils";
import type { AvailableTimeType } from "../api/availableTimes/getAvailableTimes";
import type { ServiceOptionType } from "../internal/buildServiceOptions";

const defaultValidationFailedMessage =
  "Não consegui confirmar a disponibilidade para o seu pet agora 😕 Vou te encaminhar para um atendente concluir o agendamento.";

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
    selectedAdditionals: option.string.layout({
      label: "Adicionais selecionados",
      isRequired: false,
      helperText: "Array de ids dos adicionais selecionados",
    }),
    selectedTakeAndBring: option.string.layout({
      label: "Leva e traz selecionado",
      isRequired: false,
      helperText: "Leva e traz selecionado",
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
    validationFailedMessage: option.string.layout({
      label: "Mensagem de falha na validação",
      defaultValue: defaultValidationFailedMessage,
      helperText:
        "Mensagem enviada ao cliente quando a validação não pôde ser concluída. Nesse caso o agendamento é bloqueado por precaução",
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
/**
 * A validação decide se o fluxo pode seguir agendando, então ela não pode
 * falhar em silêncio. Até a TP-4460 o catch aqui era só um `console.error`: sem
 * gravar as saídas, `isBookingBlocked` ficava com o resíduo da sessão anterior
 * e uma indisponibilidade da API virava um agendamento liberado — inclusive
 * para pet que o servidor tinha barrado. Em falha o padrão agora é bloquear e
 * mandar ao atendente, porque liberar por engano é o erro mais caro dos dois.
 */
export const VerifyBookingGuardHandler = async ({
  credentials,
  options,
  variables,
  logs,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
  logs?: LogsStore;
}) => {
  const setOutcome = ({
    blocked,
    message,
  }: {
    blocked: boolean;
    message: string;
  }) => {
    if (options.isBookingBlocked)
      variables.set([
        { id: options.isBookingBlocked as string, value: blocked },
      ]);

    if (options.bookingGuardMessage)
      variables.set([
        { id: options.bookingGuardMessage as string, value: message },
      ]);
  };

  try {
    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
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

    const selectedAdditionalIds = options.selectedAdditionals
      ? parseIds(options.selectedAdditionals)
      : [];

    // Parse tolerante de propósito: a variável é opcional, e desde a TP-4460 o
    // catch do handler bloqueia o agendamento. Sem essa tolerância um leva e
    // traz malformado mandaria o cliente para o atendente sem necessidade. É o
    // mesmo parse da busca de horários, que filtra os dias por esta restrição.
    const takeAndBringId = extractTakeAndBringId(
      safeJsonParse<unknown>(options.selectedTakeAndBring, null) ??
        options.selectedTakeAndBring,
    );

    const { services: uniqueServices, comboServiceIds } = buildGuardServiceIds({
      selectedService: parsedSelectedService,
      catalogServiceIds: serviceIds,
      selectedAdditionalIds,
      takeAndBringId,
    });

    logHandler("verifyBookingGuard", {
      petId: Number(options.petId),
      shopId: Number(options.shopId),
      segmentType: options.segmentType,
      selectedServiceId: selectedId,
      selectedServiceType: parsedSelectedService?.type,
      serviceIds: summarizeArray(serviceIds),
      comboServiceIds: summarizeArray(comboServiceIds),
      selectedAdditionalIds: summarizeArray(selectedAdditionalIds),
      takeAndBringId,
      services: uniqueServices,
      dateISO: selectedTimeOption?.dateISO ?? null,
    });

    const body: PaGetBookingGuardValidationBody = {
      petId: Number(options.petId),
      servicesId: uniqueServices,
      date: selectedTimeOption.dateISO,
      segmentType: options.segmentType as ShopSegment,
      guardScopes: BOT_GUARD_SCOPES,
    };

    const bookingGuardValidation = await tecpetSdk.bookingGuard.validation(
      body,
      Number(options.shopId),
    );

    logHandler("verifyBookingGuard", {
      blocked: bookingGuardValidation?.blocked ?? null,
      reason: bookingGuardValidation?.blocked
        ? "agendamento bloqueado pela restrição de agenda"
        : "agendamento liberado",
      guardDescription: bookingGuardValidation?.guard?.description ?? "",
    });

    setOutcome({
      blocked: Boolean(bookingGuardValidation?.blocked),
      message: bookingGuardValidation?.guard?.description ?? "",
    });
  } catch (error) {
    console.error(error);

    logHandler("verifyBookingGuard", {
      failed: true,
      blocked: true,
      reason: "validação não concluída — bloqueado por precaução",
      error: describeApiError(error),
    });

    logs?.add({
      status: "error",
      description: "Failed to verify booking guard",
      details: describeApiError(error),
    });

    setOutcome({
      blocked: true,
      message:
        (options.validationFailedMessage as string) ||
        defaultValidationFailedMessage,
    });
  }
};
