import type {
  PaGetAvailableTimesResponse,
  PaGetAvailableTimesTimesBody,
  PaGetBookingResponse,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { formatBRDate, formatISODate } from "../../../helpers/utils";
import type { AvailableTimeType } from "./getAvailableTimes";

export const getRescheduleAvailableTimes = createAction({
  auth,
  baseOptions,
  name: "Buscar opções de horário para reagendamento",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    selectedBooking: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: true,
      helperText: "Agendamento",
    }),
    availableTimes: option.string.layout({
      label: "Array de horarios disponiveis",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    showOtherDates: option.string.layout({
      label: "Escolher outras datas disponiveis",
      isRequired: true,
      helperText: "Selecionado outras datas",
    }),
    getAdditionalDays: option.string.layout({
      label: "Quantidade de dias adicionais",
      isRequired: true,
      defaultValue: "0",
      helperText: "Buscar quantidade de dias atuais",
    }),
    inputAdditionalDays: option.string.layout({
      label: "Input de dias adicionais",
      helperText: "Dias para adicionar",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ availableTimes, inputAdditionalDays }) => {
    const variables = [];

    if (availableTimes) variables.push(availableTimes);

    if (inputAdditionalDays) variables.push(inputAdditionalDays);

    return variables;
  },
  run: {
    server: async ({ credentials, options, variables, logs }) => {
      try {
        const rawBooking = options.selectedBooking;

        const booking: PaGetBookingResponse = JSON.parse(rawBooking as string);

        const services: number[] = booking?.services
          ? booking?.services?.map(
              (service: { id: number; name: string }) => service.id,
            )
          : [];

        const combos: number[] = booking?.combos
          ? booking?.combos?.map(
              (combo: { id: number; name: string }) => combo?.id,
            )
          : [];

        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const rawAdditionalDays = options.getAdditionalDays;

        let additionalDays = rawAdditionalDays ? Number(rawAdditionalDays) : 0;

        const showOtherDates = JSON.parse(options.showOtherDates ?? "false");

        if (showOtherDates) {
          additionalDays += 2;
        }

        const MAX_ATTEMPTS = 10;
        let all: AvailableTimeType[] = [];

        while (additionalDays < MAX_ATTEMPTS) {
          const today = new Date();

          if (showOtherDates) today.setDate(today.getDate() + additionalDays);

          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);

          const searchDates = [formatISODate(today), formatISODate(tomorrow)];

          all = [];

          for (const dateISO of searchDates) {
            const body: PaGetAvailableTimesTimesBody = {
              date: dateISO,
              combos,
              services,
              petId: Number(booking.petId),
              segment: booking.segmentType as ShopSegment,
            };

            const times = await tecpetSdk.availableTimes.list(
              body,
              Number(options.shopId),
            );
            times?.forEach((t: PaGetAvailableTimesResponse) =>
              all.push({
                ...t,
                dateISO,
                dateBR: formatBRDate(dateISO),
                startStop: `${t.start} - ${t.stop}`,
              }),
            );
          }
          // Se achou horários, sai do loop
          if (all.length > 0) break;
          additionalDays++;
        }

        all.sort((a, b) =>
          a.dateISO === b.dateISO
            ? a.start.localeCompare(b.start)
            : a.dateISO.localeCompare(b.dateISO),
        );

        variables.set([
          { id: options.inputAdditionalDays as string, value: additionalDays },
        ]);
        variables.set([{ id: options.availableTimes as string, value: all }]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
