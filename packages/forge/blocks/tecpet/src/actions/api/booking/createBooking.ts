import {
  type PaCreateBookingInput,
  type PaEmployeeIndication,
  type ShopSegment,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import { parseIds } from "../../../helpers/utils";
import type { ServiceOptionType } from "../../internal/buildServiceOptions";
import type { AvailableTimeType } from "../availableTimes/getAvailableTimes";

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
  }),
  getSetVariableIds: ({ booking, bookingId, invoiceId }) => {
    const variables = [];

    if (booking) variables.push(booking);
    if (bookingId) variables.push(bookingId);
    if (invoiceId) variables.push(invoiceId);

    return variables;
  },
});
export const CreateBookingHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
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

    logHandler("createBooking", { shopId: Number(options.shopId), petId: Number(options.petId), segmentType: options.segmentType, selectedServiceId: parsedSelectedService?.id, selectedServiceType: parsedSelectedService?.type, selectedTimeId: selectedTimeOption?.id, employeeIndications: summarizeArray(employeesIndications) });

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

    logHandler("createBooking", { timeId: body.timeId, petId: body.petId, servicesId: body.servicesId, combosId: body.combosId, segment: body.segment, employeeIndicationCount: body.employeeIndication?.length ?? 0 });

    const createdBooking = await tecpetSdk.booking.create(
      body,
      Number(options.shopId),
    );

    if (createdBooking) {
      logHandler("createBooking", { createdBookingId: createdBooking.id, invoiceId: createdBooking?.invoice?.id });
      variables.set([
        { id: options.booking as string, value: createdBooking },
        { id: options.bookingId as string, value: createdBooking.id },
        { id: options.invoiceId as string, value: createdBooking?.invoice?.id },
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};
