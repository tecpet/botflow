import {
  BookingGuardScopeEnum,
  type PaGetBookingGuardValidationBody,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
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
  credentials, options, variables
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
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

        // A restrição tem que ser avaliada contra o MESMO conjunto de serviços
        // que o `createBooking` vai gravar (principal + leva e traz +
        // adicionais). Validar só o principal era o bug da TP-4170: restrição
        // sobre um serviço que o fluxo só oferece como "mimo extra" nunca era
        // testada, e o agendamento passava.
        const services: number[] = [];

        let comboServiceIds: number[] = [];

        if (parsedSelectedService.type === "COMBO") {
          // O endpoint de restrição só aceita `servicesId` — não existe
          // `combosId` no contrato. Então o combo é expandido nos serviços que
          // o compõem, que já vêm no próprio objeto montado por
          // `buildServiceOptions`. Sem isso o combo saía com a lista vazia e
          // escapava de qualquer restrição de serviço.
          comboServiceIds = (parsedSelectedService.services ?? []).map(
            (service) => Number(service.id),
          );

          services.push(...comboServiceIds);
        } else if (serviceIds.includes(selectedId)) {
          services.push(selectedId);
        }

        const selectedAdditionalIds = options.selectedAdditionals
          ? parseIds(options.selectedAdditionals)
          : [];

        services.push(...selectedAdditionalIds);

        // Parse tolerante de propósito: a variável é opcional e este handler
        // falha aberto (o catch só loga e o fluxo segue agendando), então um
        // leva e traz malformado não pode derrubar a validação inteira.
        let takeAndBringId: number | null = null;

        if (options.selectedTakeAndBring) {
          try {
            const takeAndBring: ServiceOptionType = JSON.parse(
              options.selectedTakeAndBring as string,
            );

            takeAndBringId = Number(takeAndBring?.id);
          } catch {
            takeAndBringId = null;
          }

          if (takeAndBringId) services.push(takeAndBringId);
        }

        // Dedup e descarte de ids inválidos: o combo pode repetir um serviço já
        // escolhido como adicional, e o id sentinela -1 ("VER OUTROS SERVIÇOS")
        // não pode chegar na consulta.
        const uniqueServices = [...new Set(services)].filter(
          (id) => Number.isFinite(id) && id > 0,
        );

        logHandler("verifyBookingGuard", { petId: Number(options.petId), shopId: Number(options.shopId), segmentType: options.segmentType, selectedServiceId: selectedId, selectedServiceType: parsedSelectedService?.type, serviceIds: summarizeArray(serviceIds), comboServiceIds: summarizeArray(comboServiceIds), selectedAdditionalIds: summarizeArray(selectedAdditionalIds), takeAndBringId, services: uniqueServices, dateISO: selectedTimeOption?.dateISO ?? null });

        const body: PaGetBookingGuardValidationBody = {
          petId: Number(options.petId),
          servicesId: uniqueServices,
          date: selectedTimeOption.dateISO,
          segmentType: options.segmentType as ShopSegment,
          guardScopes: [BookingGuardScopeEnum.BOT, BookingGuardScopeEnum.BOTH],
        };

        const bookingGuardValidation = await tecpetSdk.bookingGuard.validation(
          body,
          Number(options.shopId),
        );

        logHandler("verifyBookingGuard", { blocked: bookingGuardValidation?.blocked ?? null, reason: bookingGuardValidation?.blocked ? "agendamento bloqueado pela restrição de agenda" : "agendamento liberado", guardDescription: bookingGuardValidation?.guard?.description ?? "" });

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
