import {
  type PaGetBookingResponse,
  Status,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import type { LogsStore } from "@typebot.io/forge/types";
import { utcToZonedTime } from "date-fns-tz";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import { describeApiError } from "../../../helpers/apiErrors";
import { DEFAULT_SHOP_TIMEZONE } from "../../../helpers/bookingMinAdvance";
import {
  formatPtBrList,
  parseBookingIdList,
} from "../../../helpers/groupReschedule";
import { logHandler, summarizeArray } from "../../../helpers/logger";
import {
  isUpcomingBooking,
  parseBookingDate,
  safeJsonParse,
} from "../../../helpers/utils";

/**
 * Carrega os agendamentos que a notificação de confirmação agrupada citou
 * (TP-4108).
 *
 * O gateway já revalidou os ids no clique do botão (PR #92), mas a notificação
 * sai um dia antes e o fluxo do bot ainda leva alguns minutos até aqui: a loja
 * pode ter cancelado ou remarcado um dos pets nesse meio tempo. Por isso cada id
 * é buscado e revalidado de novo — em aberto, futuro e do mesmo cliente — antes
 * de virar um pet que o fluxo promete mover.
 */
export const getGroupBookings = createAction({
  auth,
  baseOptions,
  name: "Carregar agendamentos do grupo",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
      helperText: "Id da loja",
    }),
    bookingIds: option.string.layout({
      label: "Ids dos agendamentos do grupo",
      isRequired: true,
      helperText:
        "Variável Agendamento.Ids — lista separada por vírgula, ordenada por horário",
    }),
    leadBookingId: option.string.layout({
      label: "Id do agendamento líder",
      isRequired: false,
      helperText:
        "Variável Agendamento.Id — usado como fallback quando a lista vem vazia",
    }),
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: false,
      helperText: "Configurações da loja (usado para ler o fuso horário)",
    }),
    groupBookings: option.string.layout({
      label: "Agendamentos do grupo (saída)",
      helperText: "Recebe os agendamentos válidos, ordenados por horário",
      inputType: "variableDropdown",
    }),
    groupBookingsCount: option.string.layout({
      label: "Quantidade de agendamentos válidos (saída)",
      helperText:
        "Recebe quantos agendamentos sobraram depois da revalidação — pode ser menor que Agendamento.Qtd",
      inputType: "variableDropdown",
    }),
    isGroupReschedule: option.string.layout({
      label: "É reagendamento em grupo (saída)",
      helperText: "Recebe true quando sobrou mais de um agendamento válido",
      inputType: "variableDropdown",
    }),
    leadBooking: option.string.layout({
      label: "Agendamento líder (saída)",
      helperText:
        "Recebe o primeiro agendamento válido, para o ramo de um pet só reaproveitar os blocos atuais",
      inputType: "variableDropdown",
    }),
    groupPetNames: option.string.layout({
      label: "Nomes dos pets (saída)",
      helperText: "Recebe JUDDY, JIMMY e BIANCA — pronto para a mensagem",
      inputType: "variableDropdown",
    }),
    groupBookingsSummary: option.string.layout({
      label: "Resumo dos agendamentos (saída)",
      helperText: "Recebe uma linha por pet: JUDDY às 09:30 (BANHO)",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    groupBookings,
    groupBookingsCount,
    isGroupReschedule,
    leadBooking,
    groupPetNames,
    groupBookingsSummary,
  }) => {
    const variables = [];

    if (groupBookings) variables.push(groupBookings);
    if (groupBookingsCount) variables.push(groupBookingsCount);
    if (isGroupReschedule) variables.push(isGroupReschedule);
    if (leadBooking) variables.push(leadBooking);
    if (groupPetNames) variables.push(groupPetNames);
    if (groupBookingsSummary) variables.push(groupBookingsSummary);

    return variables;
  },
});

const openStatuses = [Status.SCHEDULED, Status.CONFIRMED];

const describeBookingServices = (booking: PaGetBookingResponse): string =>
  [
    ...(booking.combos ?? []).map((combo) => combo.name),
    ...(booking.services ?? []).map((service) => service.name),
  ]
    .filter(Boolean)
    .join(", ");

export const GetGroupBookingsHandler = async ({
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
  const setOutcome = (bookings: PaGetBookingResponse[]) => {
    const petNames = bookings.map((booking) => booking.petName);

    if (options.groupBookings)
      variables.set([{ id: options.groupBookings as string, value: bookings }]);

    if (options.groupBookingsCount)
      variables.set([
        { id: options.groupBookingsCount as string, value: bookings.length },
      ]);

    if (options.isGroupReschedule)
      variables.set([
        {
          id: options.isGroupReschedule as string,
          value: bookings.length > 1,
        },
      ]);

    if (options.leadBooking)
      variables.set([
        { id: options.leadBooking as string, value: bookings[0] ?? "" },
      ]);

    if (options.groupPetNames)
      variables.set([
        {
          id: options.groupPetNames as string,
          value: formatPtBrList(petNames),
        },
      ]);

    if (options.groupBookingsSummary)
      variables.set([
        {
          id: options.groupBookingsSummary as string,
          value: bookings.map((booking) => {
            const services = describeBookingServices(booking);

            return services
              ? `${booking.petName} às ${booking.start} (${services})`
              : `${booking.petName} às ${booking.start}`;
          }),
        },
      ]);
  };

  try {
    const shopId = Number(options.shopId);

    // O líder entra na lista para cobrir a loja cujo gateway ainda não manda
    // `Agendamento.Ids` — ali o grupo é de um pet só e o fluxo segue igual.
    const bookingIds = parseBookingIdList([
      ...parseBookingIdList(options.bookingIds),
      ...parseBookingIdList(options.leadBookingId),
    ]);

    const shopSettings = safeJsonParse<{ timeZone?: string } | undefined>(
      options.shopSettings,
      undefined,
    );
    const shopTimezone = shopSettings?.timeZone ?? DEFAULT_SHOP_TIMEZONE;
    const nowInShopTz = utcToZonedTime(new Date(), shopTimezone);

    logHandler("getGroupBookings", {
      shopId,
      rawBookingIds: options.bookingIds,
      bookingIds,
      shopTimezone,
    });

    if (bookingIds.length === 0) {
      logHandler("getGroupBookings", {
        skipped: true,
        reason: "nenhum id de agendamento utilizável",
      });
      setOutcome([]);
      return;
    }

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const loaded = await Promise.all(
      bookingIds.map(async (bookingId) => {
        try {
          return await tecpetSdk.booking.get(bookingId, shopId);
        } catch (error) {
          // Agendamento inexistente, de outra loja ou API fora: o pet fica de
          // fora do grupo em vez de derrubar o reagendamento dos irmãos.
          logHandler("getGroupBookings", {
            bookingId,
            lookupFailed: true,
            error: describeApiError(error),
          });
          return null;
        }
      }),
    );

    const bookings = loaded.filter(
      (booking): booking is PaGetBookingResponse => {
        if (!booking?.id) return false;

        const isOpen = openStatuses.includes(booking.status);
        const isUpcoming = isUpcomingBooking(
          booking.date ?? "",
          booking.start ?? "",
          nowInShopTz,
        );
        // O vínculo com o cliente fica com o gateway (PR #92): o agendamento da
        // Public API não traz o `clientId`, então não há o que revalidar aqui.
        const kept = isOpen && isUpcoming;

        if (!kept)
          logHandler("getGroupBookings", {
            bookingId: booking.id,
            discarded: true,
            status: booking.status,
            date: booking.date,
            start: booking.start,
            isOpen,
            isUpcoming,
          });

        return kept;
      },
    );

    bookings.sort(
      (a, b) =>
        parseBookingDate(a.date, a.start).getTime() -
          parseBookingDate(b.date, b.start).getTime() || a.id - b.id,
    );

    logHandler("getGroupBookings", {
      requested: bookingIds.length,
      valid: bookings.length,
      bookings: summarizeArray(
        bookings.map((booking) => ({
          id: booking.id,
          petId: booking.petId,
          petName: booking.petName,
          date: booking.date,
          start: booking.start,
        })),
      ),
    });

    setOutcome(bookings);
  } catch (error) {
    console.error(error);
    logs?.add({
      status: "error",
      description: "Failed to load group bookings",
      details: describeApiError(error),
    });
    logHandler("getGroupBookings", {
      handlerFailed: true,
      error: describeApiError(error),
    });

    // Falha fechada: sem grupo, o fluxo segue pelo ramo de um pet só que já
    // existe (com o `Agendamento.Id` que ele já tinha) em vez de reentrar aqui.
    setOutcome([]);
  }
};
