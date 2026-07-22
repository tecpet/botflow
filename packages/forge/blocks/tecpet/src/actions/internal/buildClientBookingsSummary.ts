import type { PaGetBookingResponse, PaPetResponse } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { utcToZonedTime } from "date-fns-tz";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { formatBRDateStringDayMonth } from "../../helpers/utils";

export const buildClientBookingsSummary = createAction({
  baseOptions,
  name: "Montar lista de agendamentos do cliente",
  options: option.object({
    pet: option.string.layout({
      label: "Pet do cliente",
      isRequired: true,
    }),
    clientBookings: option.string.layout({
      label: "Agendamentos do cliente",
      isRequired: true,
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: false,
      helperText: "Configurações da loja (usado para ler o fuso horário)",
    }),
    bookingsValue: option.string.layout({
      label: "Agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    bookingsName: option.string.layout({
      label: "Nome dos agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    bookingsDescription: option.string.layout({
      label: "Descrição dos agendamentos",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ bookingsValue, bookingsName, bookingsDescription }) => {
    const variables = [];

    if (bookingsValue) variables.push(bookingsValue);
    if (bookingsName) variables.push(bookingsName);
    if (bookingsDescription) variables.push(bookingsDescription);

    return variables;
  },
});
export const BuildClientBookingsSummaryHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const rawPet = options.pet as string;
    const rawClientBookings = options.clientBookings;

    const pet: PaPetResponse = JSON.parse(rawPet);

    let shopSettings: { timeZone?: string } | undefined;
    try {
      shopSettings = options.shopSettings
        ? JSON.parse(options.shopSettings as string)
        : undefined;
    } catch (parseError) {
      console.error(
        "[buildClientBookingsSummary] falha ao fazer parse de shopSettings",
        { rawShopSettings: options.shopSettings },
        parseError,
      );
    }

    const shopTimezone = shopSettings?.timeZone ?? "America/Sao_Paulo";

    const clientBookingsParsed: string[] = rawClientBookings
      ? JSON.parse(rawClientBookings as string)
      : [];

    const bookings: Array<
      PaGetBookingResponse & {
        bookingDescription?: string;
        backToMenu?: boolean;
      }
    > = clientBookingsParsed.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    );

    logHandler("buildClientBookingsSummary", {
      petId: pet.id,
      petName: pet.name,
      shopTimezone,
      inputBookings: summarizeArray(
        bookings.map((b) => ({
          id: b.id,
          petId: b.petId,
          status: b.status,
          date: b.date,
          start: b.start,
        })),
      ),
    });

    // `date`/`start` vêm no fuso da loja, mas `new Date(y, m, d, h, min)` os
    // interpreta no fuso do container (UTC em produção). Comparar contra
    // `Date.now()` descartava como "passado" todo agendamento a menos de ~3h30
    // de acontecer. Trazemos o "agora" para o fuso da loja para que ambos os
    // lados da comparação estejam na mesma referência de horário de parede.
    const nowInShopTimezone = utcToZonedTime(new Date(), shopTimezone);

    const parseBookingDate = (date: string, start: string): Date => {
      const [day, month, year] = date.split("/").map(Number);
      const [hour, minute] = start.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute);
    };

    // Corte apenas para agendamentos genuinamente passados (data+hora antes de
    // "agora" no fuso da loja): esses saem da lista. A antecedência mínima para
    // alterar/cancelar NÃO é avaliada aqui — fica a cargo das validações
    // dedicadas (validateRescheduleMinAdvanceHours / validateCancelMinAdvanceHours),
    // que recebem o agendamento selecionado + a config da loja e a antecedência
    // configurada (minReschedule/minCancelAdvanceHours).
    const isUpcomingBooking = (date: string, start: string): boolean =>
      parseBookingDate(date, start) >= nowInShopTimezone;

    const filteredBookings: Array<
      Partial<
        PaGetBookingResponse & {
          bookingDescription?: string;
          backToMenu?: boolean;
        }
      >
    > = bookings
      .filter(
        (booking) =>
          booking.petId === pet.id &&
          (booking.status === "SCHEDULED" || booking.status === "CONFIRMED") &&
          isUpcomingBooking(booking.date ?? "", booking.start ?? ""),
      )
      .sort(
        (a, b) =>
          parseBookingDate(a.date ?? "", a.start ?? "").getTime() -
          parseBookingDate(b.date ?? "", b.start ?? "").getTime(),
      );

    filteredBookings.forEach((booking) => {
      let bookingDescription = "";
      booking.services?.forEach((service, index) => {
        if (index > 0) {
          bookingDescription += " + ";
        }
        bookingDescription += service.name;
      });

      booking["bookingDescription"] = bookingDescription;

      booking.date = formatBRDateStringDayMonth(booking.date ?? "");
    });

    filteredBookings.push({
      backToMenu: true,
      start: "",
      stop: "",
    });

    logHandler("buildClientBookingsSummary", {
      outputFilteredBookings: summarizeArray(
        filteredBookings.map((b) => ({
          id: b.id,
          date: b.date,
          start: b.start,
          bookingDescription: b.bookingDescription,
          backToMenu: b.backToMenu,
        })),
      ),
    });

    variables.set([
      {
        id: options.bookingsValue as string,
        value: filteredBookings,
      },
    ]);
    variables.set([
      {
        id: options.bookingsDescription as string,
        value: filteredBookings.map((b) => b.bookingDescription ?? ""),
      },
    ]);
    variables.set([
      {
        id: options.bookingsName as string,
        value: filteredBookings.map((b) => {
          if (!b.backToMenu) {
            return `${b.date} - ${b.start}`;
          } else {
            return "VOLTAR AO MENU";
          }
        }),
      },
    ]);
  } catch (error) {
    console.error(error);
  }
};
