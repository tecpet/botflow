import {
  type PaCreateBookingInput,
  type PaEmployeeIndication,
  type PaGetBookingResponse,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import {
  describeApiError,
  isTecpetApiError,
  TecpetApiError,
} from "../../../helpers/apiErrors";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import { parseIds } from "../../../helpers/utils";
import type { ServiceOptionType } from "../../internal/buildServiceOptions";
import type { AvailableTimeType } from "../availableTimes/getAvailableTimes";

const defaultTimeUnavailableMessage =
  "Esse horário não está mais disponível para o seu pet 😕 Vamos escolher outro?";

/**
 * Recusas de horário que o fluxo trata oferecendo outro slot, em vez de mandar
 * o cliente para o atendente (TP-4219). O `PET_ALREADY_BOOKED_AT_TIME` é o
 * código de negócio novo da Public API; o `TIME_ALREADY_ALLOCATED` é a mensagem
 * crua do servidor, mantida para o bloco reconhecer o conflito também antes do
 * deploy da API.
 */
const timeUnavailableErrors = [
  TecpetApiError.PET_ALREADY_BOOKED_AT_TIME,
  TecpetApiError.TIME_ALREADY_ALLOCATED,
];

export const createBooking = createAction({
  auth,
  baseOptions,
  name: "Criar um agendamento",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    servicesIds: option.string.layout({
      label: "Ids dos serviços disponiveis",
      isRequired: true,
      helperText: "Ids dos serviços disponiveis",
    }),
    employeeIndications: option.string.layout({
      label: "Funcionários indicados para o serviço",
      isRequired: true,
    }),
    combosIds: option.string.layout({
      label: "Ids dos combos disponiveis",
      isRequired: true,
      helperText: "Ids dos combos disponiveis",
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
    selectedServices: option.string.layout({
      label: "Serviços selecionado",
      isRequired: true,
      helperText: "Serviços selecionado",
    }),
    selectedAdditionals: option.string.layout({
      label: "Adicionais selecionados",
      isRequired: true,
      helperText: "Adicionais selecionados",
    }),
    selectedTakeAndBring: option.string.layout({
      label: "Leva e traz selecionado",
      isRequired: false,
      helperText: "Leva e traz selecionado",
    }),
    selectedTimeOption: option.string.layout({
      label: "Horário selecionado",
      isRequired: true,
      helperText: "Horário selecionado",
    }),
    booking: option.string.layout({
      label: "Agendamento criado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    bookingId: option.string.layout({
      label: "Agendamento criado Id",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    invoiceId: option.string.layout({
      label: "ID da fatura",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    timeUnavailableMessage: option.string.layout({
      label: "Mensagem de horário indisponível",
      defaultValue: defaultTimeUnavailableMessage,
      helperText:
        "Mensagem enviada ao cliente quando a API recusa o horário porque o pet já tem compromisso nele",
    }),
    bookingSuccess: option.string.layout({
      label: "Agendamento realizado",
      helperText: "Recebe true somente quando a API confirmou o agendamento",
      inputType: "variableDropdown",
    }),
    bookingBlockedMessage: option.string.layout({
      label: "Mensagem de agendamento bloqueado (saída)",
      helperText:
        "Recebe a mensagem a ser exibida quando o agendamento é recusado por horário indisponível. Vazio nas demais falhas",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    booking,
    bookingId,
    invoiceId,
    bookingSuccess,
    bookingBlockedMessage,
  }) => {
    const variables = [];

    if (booking) variables.push(booking);
    if (bookingId) variables.push(bookingId);
    if (invoiceId) variables.push(invoiceId);
    if (bookingSuccess) variables.push(bookingSuccess);
    if (bookingBlockedMessage) variables.push(bookingBlockedMessage);

    return variables;
  },
});
/**
 * O handler não decide nada: ele traduz a resposta da API em variáveis para o
 * fluxo escolher o caminho (sucesso ou horário indisponível).
 *
 * Antes da TP-4219 o catch aqui só fazia `console.error`, sem nenhuma saída
 * observável. Pior: como variável do Typebot sobrevive entre etapas da sessão,
 * `booking`/`bookingId`/`invoiceId` ficavam com o valor do agendamento
 * ANTERIOR, e o fluxo seguia para o ramo de sucesso confirmando ao cliente um
 * agendamento que a API tinha recusado — às vezes citando o id de um
 * agendamento antigo. É o mesmo desenho que a TP-4050 já aplicou no
 * `rescheduleBooking`. O fluxo só pode confirmar quando `bookingSuccess` for
 * true.
 */
export const CreateBookingHandler = async ({
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
  // Sempre grava as saídas, inclusive limpando o resíduo da sessão anterior: era
  // justamente a variável NÃO gravada que fazia o fluxo confirmar o que não
  // aconteceu.
  const setOutcome = ({
    success,
    createdBooking,
    message,
  }: {
    success: boolean;
    createdBooking?: PaGetBookingResponse;
    message: string;
  }) => {
    if (options.booking)
      variables.set([
        { id: options.booking as string, value: createdBooking ?? null },
      ]);

    if (options.bookingId)
      variables.set([
        { id: options.bookingId as string, value: createdBooking?.id ?? null },
      ]);

    if (options.invoiceId)
      variables.set([
        {
          id: options.invoiceId as string,
          value: createdBooking?.invoice?.id ?? null,
        },
      ]);

    if (options.bookingSuccess)
      variables.set([{ id: options.bookingSuccess as string, value: success }]);

    if (options.bookingBlockedMessage)
      variables.set([
        { id: options.bookingBlockedMessage as string, value: message },
      ]);
  };

  try {
    const selectedTimeOption: AvailableTimeType = JSON.parse(
      options.selectedTimeOption as string,
    );

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const parsedSelectedService: ServiceOptionType = options.selectedServices
      ? JSON.parse(options.selectedServices as string)
      : undefined;

    const parsedEmployeeIndications: string[] = options.employeeIndications
      ? JSON.parse(options.employeeIndications as string)
      : [];

    const employeesIndications: PaEmployeeIndication[] =
      parsedEmployeeIndications.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );

    logHandler("createBooking", {
      shopId: Number(options.shopId),
      petId: Number(options.petId),
      segmentType: options.segmentType,
      selectedServiceId: parsedSelectedService?.id,
      selectedServiceType: parsedSelectedService?.type,
      selectedTimeId: selectedTimeOption?.id,
      employeeIndications: summarizeArray(employeesIndications),
    });

    const serviceIds = parseIds(options.servicesIds);
    const comboIds = parseIds(options.combosIds);
    const selectedId = Number(parsedSelectedService.id);

    const services: number[] = serviceIds.includes(selectedId)
      ? [selectedId]
      : [];

    const combos: number[] = comboIds.includes(selectedId) ? [selectedId] : [];

    if (options.selectedTakeAndBring) {
      const takeAndBring: ServiceOptionType = JSON.parse(
        options.selectedTakeAndBring as string,
      );
      services.push(takeAndBring.id);
    }

    JSON.parse((options.selectedAdditionals as string) ?? "[]").forEach(
      (id: string | number) => services.push(Number(id)),
    );

    const body: PaCreateBookingInput = {
      timeId: selectedTimeOption.id ?? "",
      petId: Number(options.petId),
      servicesId: services,
      employeeIndication: employeesIndications,
      combosId: combos,
      segment: options.segmentType as ShopSegment,
    };

    logHandler("createBooking", {
      timeId: body.timeId,
      petId: body.petId,
      servicesId: body.servicesId,
      combosId: body.combosId,
      segment: body.segment,
      employeeIndicationCount: body.employeeIndication?.length ?? 0,
    });

    const createdBooking = await tecpetSdk.booking.create(
      body,
      Number(options.shopId),
    );

    // Resposta vazia ou sem id não é sucesso: sem isso um retorno inesperado da
    // API passava batido e o fluxo confirmava assim mesmo.
    if (!createdBooking?.id) {
      logHandler("createBooking", {
        failed: true,
        reason: "a API não devolveu um agendamento",
      });
      logs?.add({
        status: "error",
        description: "Failed to create booking",
        details: "A API não devolveu um agendamento criado",
      });
      setOutcome({ success: false, message: "" });
      return;
    }

    logHandler("createBooking", {
      createdBookingId: createdBooking.id,
      invoiceId: createdBooking?.invoice?.id,
    });
    setOutcome({ success: true, createdBooking, message: "" });
  } catch (error) {
    const timeUnavailable = timeUnavailableErrors.some((apiError) =>
      isTecpetApiError(error, apiError),
    );

    logHandler("createBooking", {
      failed: true,
      timeUnavailable,
      error: describeApiError(error),
    });

    if (!timeUnavailable) {
      console.error(error);
      logs?.add({
        status: "error",
        description: "Failed to create booking",
        details: describeApiError(error),
      });
    }

    setOutcome({
      success: false,
      message: timeUnavailable
        ? (options.timeUnavailableMessage as string) ||
          defaultTimeUnavailableMessage
        : "",
    });
  }
};
