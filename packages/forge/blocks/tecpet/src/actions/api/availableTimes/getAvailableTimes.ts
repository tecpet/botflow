import {createAction, option} from "@typebot.io/forge";
import {TecpetSDK} from "tecpet-sdk";
import {auth} from "../../../auth";
import {baseOptions, tecpetDefaultBaseUrl} from "../../../constants";
import {formatBRDate, formatISODate, parseIds} from "../../../helpers/utils";

export const getAvailableTimes = createAction({
  auth,
  baseOptions,
  name: "Buscar opções de horário",
  options: option.object({
    shopId: option.string.layout({
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
    petId: option.string.layout({
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
  }),
  getSetVariableIds: ({pets}) => (pets ? [pets] : []),
  run: {
    server: async ({credentials, options, variables, logs}) => {
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
        (typeof additionalsRaw === "string" ? JSON.parse(additionalsRaw) : additionalsRaw)
          .forEach((id: string | number) => services.push(Number(id)));

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const searchDates = [formatISODate(today), formatISODate(tomorrow)];

        type TimeItem = ReturnType<typeof tecpetSdk.availableTimes.list>[number] & {
          dateISO: string;           // 2025-06-11
          dateBR: string;           // 11/06/2025
          startStop: string;         // 08:00 - 10:00
        };

        const all: TimeItem[] = [];

        for (const dateISO of searchDates) {
          const body = {
            date: dateISO,
            combos,
            services,
            petId: options.petId,
            segment: options.segmentType,
          };

          const times = await tecpetSdk.availableTimes.list(body, options.shopId);

          times?.forEach((t: any) =>
            all.push({
              ...t,
              dateISO,
              dateBR: formatBRDate(dateISO),
              startStop: `${t.start} - ${t.stop}`,
            }),
          );
        }

        all.sort((a, b) =>
          a.dateISO === b.dateISO
            ? a.start.localeCompare(b.start)
            : a.dateISO.localeCompare(b.dateISO),
        );

        variables.set([{id: options.availableTimes, value: all}]);
      } catch (error) {
        logs.add({
          status: "error",
          description: JSON.stringify(error),
        });
      }
    },
  },
});
