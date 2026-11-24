import {
  type ChatbotActionJson,
  ChatbotInfoCollectionBehaviorEnum,
  type PaGetBookingResponse,
} from "@tec.pet/tecpet-sdk";
import { formatPtBrList } from "./groupReschedule";

/**
 * Reagendamento de agendamento com leva e traz (TP-5997).
 *
 * O reagendamento do bot lê a configuração da ação "Meus agendamentos"
 * (`BOOKING`), mas o comportamento do leva e traz fica na ação do segmento do
 * agendamento ("Agendar banho e tosa" = `PET_SHOP`, "Agendar consulta" =
 * `CLINIC`...). Sem esta checagem, uma loja com "Não oferecer e Falar com
 * atendente" via o bot remarcar sozinho um agendamento com leva e traz e mover
 * a busca do pet para o novo horário sem ninguém da loja saber. A IA já mandava
 * esses casos para o atendente.
 *
 * Tudo aqui é função pura, sem I/O: o handler só entrega as variáveis do fluxo.
 */

/** Comportamentos do leva e traz em que a loja quer um atendente cuidando dele. */
export const TAKE_AND_BRING_ATTENDANT_BEHAVIORS: ReadonlySet<string> = new Set([
  ChatbotInfoCollectionBehaviorEnum.DONT_OFFER_AND_SEND_TO_ATTENDANT,
  ChatbotInfoCollectionBehaviorEnum.OFFER_AND_SEND_TO_ATTENDANT,
]);

export const PET_NAME_PLACEHOLDER = "{PET_NAME}";

export const DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE = `O agendamento de ${PET_NAME_PLACEHOLDER} tem leva e traz, então a remarcação é feita por um atendente. Vou te encaminhar 😊`;

export const DEFAULT_RESCHEDULE_TAKE_AND_BRING_FAILED_MESSAGE =
  "Não consegui conferir o seu agendamento agora 😕 Vou te encaminhar para um atendente fazer a remarcação.";

/** O mínimo do agendamento que a checagem usa. */
export type RescheduleTakeAndBringBooking = Pick<
  PaGetBookingResponse,
  "id" | "petName" | "segmentType" | "hasTakeAndBring"
>;

export type RescheduleTakeAndBringAction = Pick<
  ChatbotActionJson,
  "actionType" | "enabled" | "infoCollectionMenus"
>;

export type TakeAndBringBookingOutcome =
  /** A ação do segmento manda o leva e traz para o atendente. */
  | "ATTENDANT_BEHAVIOR"
  /** Nenhuma ação habilitada do segmento do agendamento: na dúvida, atendente. */
  | "SEGMENT_ACTION_NOT_FOUND"
  /** A ação do segmento agenda o leva e traz pelo bot: segue o reagendamento. */
  | "ALLOWED_BEHAVIOR";

export type TakeAndBringBookingCheck = {
  bookingId: number;
  petName: string | null;
  segmentType: string | null;
  /** Comportamento do leva e traz de cada ação habilitada do segmento. */
  behaviors: (string | null)[];
  outcome: TakeAndBringBookingOutcome;
};

export type RescheduleTakeAndBringReason =
  /** Nenhum agendamento utilizável na entrada: não dá para conferir. */
  | "NO_BOOKING"
  /** Nenhum dos agendamentos tem leva e traz. */
  | "NO_TAKE_AND_BRING"
  /** Todos os agendamentos com leva e traz são de segmento que agenda pelo bot. */
  | "BEHAVIOR_ALLOWS"
  | "BEHAVIOR_SENDS_TO_ATTENDANT"
  | "SEGMENT_ACTION_NOT_FOUND";

export type RescheduleTakeAndBringDecision = {
  sendToAttendant: boolean;
  reason: RescheduleTakeAndBringReason;
  /** Só os agendamentos com leva e traz, com o que decidiu cada um. */
  checks: TakeAndBringBookingCheck[];
};

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  if (trimmed === "") return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

/**
 * Lê uma lista de objetos vinda de uma variável do Typebot. O mesmo valor chega
 * em formatos diferentes conforme o caminho: o `{{Grupo.Agendamentos}}` e o
 * `{{Acoes.Menu.Valores}}` chegam como JSON de uma lista de strings JSON (o
 * Typebot guarda cada item da lista como texto), e o `{{Agendamento.Selecionado}}`
 * chega como o JSON de um objeto só.
 *
 * Nunca lança: entrada ruim vira lista vazia, e quem chama decide o que isso
 * significa. Itens que não são objeto são descartados.
 */
export const parseObjectList = <T extends object>(raw: unknown): T[] => {
  const parsed = parseMaybeJson(raw);

  const items = Array.isArray(parsed) ? parsed : parsed == null ? [] : [parsed];

  return items
    .map(parseMaybeJson)
    .filter(
      (item): item is T =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    );
};

const isTrue = (value: unknown) => value === true || value === "true";

const takeAndBringBehaviorOf = (
  action: RescheduleTakeAndBringAction,
): string | null =>
  action.infoCollectionMenus?.takeAndBring?.allowTakeAndBring?.behavior ?? null;

/**
 * Decide se o reagendamento tem que ir para o atendente por causa do leva e
 * traz.
 *
 * - Agendamento sem leva e traz segue normal, qualquer que seja a configuração.
 * - Com leva e traz, vale o comportamento da ação do segmento do agendamento
 *   (`actionType` igual ao `segmentType`): "Oferecer e Falar com atendente" e
 *   "Não oferecer e Falar com atendente" mandam para o atendente; "Oferecer e
 *   Agendar", "Não oferecer e Agendar" e comportamento vazio seguem pelo bot.
 * - Sem ação habilitada daquele segmento, não dá para saber o que a loja quer:
 *   vai para o atendente.
 * - No reagendamento em grupo, basta um agendamento mandar para o atendente para
 *   o grupo todo ir, porque o grupo é remarcado junto.
 * - Sem nenhum agendamento utilizável também vai para o atendente. Nos fluxos
 *   isso não deveria acontecer (a antecedência mínima já barra antes), então o
 *   mais provável é a variável errada no bloco, e o erro aparece no teste em vez
 *   de liberar o leva e traz em silêncio.
 */
export const resolveRescheduleTakeAndBring = ({
  bookings,
  chatbotActions,
}: {
  bookings: Partial<RescheduleTakeAndBringBooking>[];
  chatbotActions: Partial<RescheduleTakeAndBringAction>[];
}): RescheduleTakeAndBringDecision => {
  const usableBookings = bookings.filter((booking) => Number(booking?.id) > 0);

  if (usableBookings.length === 0)
    return { sendToAttendant: true, reason: "NO_BOOKING", checks: [] };

  const checks: TakeAndBringBookingCheck[] = usableBookings
    .filter((booking) => isTrue(booking.hasTakeAndBring))
    .map((booking) => {
      // `ShopSegment` e `ChatbotActionTypeEnum` são enums diferentes com os
      // mesmos valores (PET_SHOP, CLINIC, DAY_CARE, HOTEL): compara como texto.
      const segmentType: string | null = booking.segmentType ?? null;

      const segmentActions = chatbotActions.filter((action) => {
        const actionType: string | undefined = action?.actionType;

        return (
          Boolean(segmentType) &&
          actionType === segmentType &&
          action?.enabled !== false
        );
      }) as RescheduleTakeAndBringAction[];

      const behaviors = segmentActions.map(takeAndBringBehaviorOf);

      const outcome: TakeAndBringBookingOutcome =
        segmentActions.length === 0
          ? "SEGMENT_ACTION_NOT_FOUND"
          : behaviors.some(
                (behavior) =>
                  behavior !== null &&
                  TAKE_AND_BRING_ATTENDANT_BEHAVIORS.has(behavior),
              )
            ? "ATTENDANT_BEHAVIOR"
            : "ALLOWED_BEHAVIOR";

      return {
        bookingId: Number(booking.id),
        petName: booking.petName ?? null,
        segmentType,
        behaviors,
        outcome,
      };
    });

  if (checks.length === 0)
    return { sendToAttendant: false, reason: "NO_TAKE_AND_BRING", checks };

  if (checks.some((check) => check.outcome === "ATTENDANT_BEHAVIOR"))
    return {
      sendToAttendant: true,
      reason: "BEHAVIOR_SENDS_TO_ATTENDANT",
      checks,
    };

  if (checks.some((check) => check.outcome === "SEGMENT_ACTION_NOT_FOUND"))
    return {
      sendToAttendant: true,
      reason: "SEGMENT_ACTION_NOT_FOUND",
      checks,
    };

  return { sendToAttendant: false, reason: "BEHAVIOR_ALLOWS", checks };
};

/**
 * Monta a mensagem para o tutor com o nome dos pets cujo leva e traz mandou o
 * reagendamento para o atendente. `{PET_NAME}` vira "TOBEY" ou "JUDDY e JIMMY";
 * sem nome, "seu pet".
 */
export const buildRescheduleTakeAndBringMessage = (
  template: string,
  decision: RescheduleTakeAndBringDecision,
): string => {
  const petNames = [
    ...new Set(
      decision.checks
        .filter((check) => check.outcome !== "ALLOWED_BEHAVIOR")
        .map((check) => check.petName?.trim() ?? "")
        .filter(Boolean),
    ),
  ];

  return template
    .split(PET_NAME_PLACEHOLDER)
    .join(formatPtBrList(petNames) || "seu pet");
};
