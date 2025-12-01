import type {
  PaGetAvailableTimesResponse,
  PaGetAvailableTimesTimesBody,
  ShopSegment,
} from "@tec.pet/tecpet-sdk";
import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { formatBRDate, formatISODate, parseIds } from "../../../helpers/utils";
import type { ServiceOptionType } from "../../internal/buildServiceOptions";

export type AvailableTimeType = PaGetAvailableTimesResponse & {
  dateISO: string; // 2025-06-11
  dateBR: string; // 11/06/2025
  scheduleStartTime: string; // 08:00
};

export const getAvailableTimes = createAction({
  auth,
  baseOptions,
  name: "Buscar opções de horário",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    bookingId: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: false,
      helperText: "Agendamento",
    }),
    combosIds: option.string.layout({
      label: "Id dos combos disponiveis",
      isRequired: true,
      helperText: "Id dos combos disponiveis",
    }),
    servicesIds: option.string.layout({
      label: "Id dos serviços disponiveis",
      isRequired: true,
      helperText: "Id dos serviços disponiveis",
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
    selectedService: option.string.layout({
      label: "Serviço selecionado",
      helperText: "Serviço selecionado",
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
    noTimesAvailable: option.string.layout({
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
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const rawAdditionalDays = options.getAdditionalDays;

        const bookingId = JSON.parse(options.bookingId as string);

        let services: number[] = [];
        let combos: number[] = [];

        if (bookingId) {
          services = parseIds(options.servicesIds);
          combos = parseIds(options.combosIds);
        } else {
          const parsedSelectedService: ServiceOptionType = JSON.parse(
            options.selectedService as string,
          );

          const serviceIds = parseIds(options.servicesIds);
          const comboIds = parseIds(options.combosIds);

          const selectedId = Number(parsedSelectedService.id);

          services = serviceIds.includes(selectedId) ? [selectedId] : [];
          combos = comboIds.includes(selectedId) ? [selectedId] : [];
        }

        let additionalDays = rawAdditionalDays ? Number(rawAdditionalDays) : 0;

        const showOtherDates = JSON.parse(options.showOtherDates ?? "false");

        if (showOtherDates) {
          additionalDays += 2;
        }

        const MAX_ATTEMPTS = 10; // As tentativas máximas vao ser o total dividido pelos dias adicionais no caso são 5 que seria 10/2;

        const today = new Date();

        if (showOtherDates) today.setDate(today.getDate() + additionalDays);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const searchDates = [formatISODate(today), formatISODate(tomorrow)];

        const all: AvailableTimeType[] = [];

        for (const dateISO of searchDates) {
          const body: PaGetAvailableTimesTimesBody = {
            date: dateISO,
            combos,
            services,
            petId: Number(options.petId),
            segment: options.segmentType as ShopSegment,
          };

          let times: PaGetAvailableTimesResponse[] = [];

          try {
            times = await tecpetSdk.availableTimes.list(
              body,
              Number(options.shopId),
            );
            times?.forEach((t: PaGetAvailableTimesResponse) =>
              all.push({
                ...t,
                dateISO,
                dateBR: formatBRDate(dateISO),
                scheduleStartTime: `${t.start}`,
              }),
            );
          } catch (error) {
            console.log(error);
          }
        }

        if (all.length > 0) {
          all.sort((a, b) =>
            a.dateISO === b.dateISO
              ? a.start.localeCompare(b.start)
              : a.dateISO.localeCompare(b.dateISO),
          );
        }

        if (additionalDays > MAX_ATTEMPTS) {
          variables.set([
            { id: options.noTimesAvailable as string, value: true },
          ]);
        }

        variables.set([
          { id: options.inputAdditionalDays as string, value: additionalDays },
        ]);
        variables.set([
          { id: options.availableTimes as string, value: all ?? [] },
        ]);
      } catch (error) {
        console.error(error);
      }
    },
  },
});
