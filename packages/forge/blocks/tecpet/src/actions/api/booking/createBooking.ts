import type { PaCreateBookingInput, ShopSegment } from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { parseIds } from "../../../helpers/utils";

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
      label: "Serviços selecionados",
      isRequired: true,
      helperText: "Serviços selecionados",
    }),
    selectedAdditionals: option.string.layout({
      label: "Adicionais selecionados",
      isRequired: true,
      helperText: "Adicionais selecionados",
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
  }),
  getSetVariableIds: ({ booking, bookingId }) => {
    const variables = [];

    if (booking) variables.push(booking);
    if (bookingId) variables.push(bookingId);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const serviceIds = parseIds(options.servicesIds);
        const comboIds = parseIds(options.combosIds);
        const selectedId = Number(options.selectedServices);

        const services = serviceIds.includes(selectedId) ? [selectedId] : [];
        const combos = comboIds.includes(selectedId) ? [selectedId] : [];

        const additionalsRaw = options.selectedAdditionals ?? "[]";
        (typeof additionalsRaw === "string"
          ? JSON.parse(additionalsRaw)
          : additionalsRaw
        ).forEach((id: string | number) => services.push(Number(id)));

        const body: PaCreateBookingInput = {
          timeId: options.selectedTimeOption ?? "",
          petId: Number(options.petId),
          servicesId: services,
          combosId: combos,
          segment: options.segmentType as ShopSegment,
        };
        const createdBooking = await tecpetSdk.booking.create(
          body,
          Number(options.shopId),
        );
        if (createdBooking) {
          variables.set([
            { id: options.booking as string, value: createdBooking },
          ]);
          variables.set([
            { id: options.bookingId as string, value: createdBooking.id },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
});
