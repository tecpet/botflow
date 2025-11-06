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
    selectedServices: option.string.layout({
      label: "Serviços selecionados",
      isRequired: true,
      helperText: "Serviços selecionados",
    }),
    selectedAdditionals: option.string.layout({
      label: "Serviços adicionais selecionados",
      isRequired: true,
      helperText: "Serviços adicionais selecionados",
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
        const tecpetSdk = new TecpetSDK(
          credentials.baseUrl ?? tecpetDefaultBaseUrl,
          credentials.apiKey,
        );

        const rawAdditionalDays = options.getAdditionalDays;
        const parsedSelectedService: ServiceOptionType = JSON.parse(
          options.selectedServices as string,
        );

        let additionalDays = rawAdditionalDays ? Number(rawAdditionalDays) : 0;

        const showOtherDates = JSON.parse(options.showOtherDates ?? "false");

        if (showOtherDates) {
          additionalDays += 2;
        }

        const serviceIds = parseIds(options.servicesIds);
        const comboIds = parseIds(options.combosIds);

        const selectedId = Number(parsedSelectedService.id);

        const services = serviceIds.includes(selectedId) ? [selectedId] : [];
        const combos = comboIds.includes(selectedId) ? [selectedId] : [];

        const additionalsRaw = options.selectedAdditionals ?? "[]";
        (typeof additionalsRaw === "string"
          ? JSON.parse(additionalsRaw)
          : additionalsRaw
        ).forEach((id: string | number) => services.push(Number(id)));

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
              petId: Number(options.petId),
              segment: options.segmentType as ShopSegment,
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
                scheduleStartTime: `${t.start}`,
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
