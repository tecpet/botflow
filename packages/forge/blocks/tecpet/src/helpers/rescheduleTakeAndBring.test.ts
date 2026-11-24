import { describe, expect, it } from "bun:test";
import { ChatbotActionTypeEnum } from "@tec.pet/tecpet-sdk";
import {
  buildRescheduleTakeAndBringMessage,
  DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE,
  parseObjectList,
  type RescheduleTakeAndBringAction,
  type RescheduleTakeAndBringBooking,
  resolveRescheduleTakeAndBring,
} from "./rescheduleTakeAndBring";

const booking = (
  overrides: Partial<RescheduleTakeAndBringBooking> = {},
): Partial<RescheduleTakeAndBringBooking> => ({
  id: 10282016,
  petName: "MEGGY",
  segmentType: "PET_SHOP" as RescheduleTakeAndBringBooking["segmentType"],
  hasTakeAndBring: true,
  ...overrides,
});

const action = (
  actionType: string,
  behavior: string | undefined,
  overrides: Partial<RescheduleTakeAndBringAction> = {},
): Partial<RescheduleTakeAndBringAction> =>
  ({
    actionType,
    enabled: true,
    infoCollectionMenus: {
      takeAndBring: {
        allowTakeAndBring: {
          enabled: true,
          message: "Você gostaria que buscássemos seu pet?",
          minAdvanceHours: 4,
          behavior,
        },
      },
    },
    ...overrides,
  }) as Partial<RescheduleTakeAndBringAction>;

/** As outras ações do menu, que não têm leva e traz. */
const bookingMenu: Partial<RescheduleTakeAndBringAction> = {
  actionType: ChatbotActionTypeEnum.BOOKING,
  enabled: true,
};
const humanSupport: Partial<RescheduleTakeAndBringAction> = {
  actionType: ChatbotActionTypeEnum.HUMAN_SUPPORT,
  enabled: true,
};

describe("resolveRescheduleTakeAndBring", () => {
  it("agendamento sem leva e traz segue, mesmo com a loja mandando o leva e traz para o atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ hasTakeAndBring: false })],
      chatbotActions: [action("PET_SHOP", "DONT_OFFER_AND_SEND_TO_ATTENDANT")],
    });

    expect(decision).toEqual({
      sendToAttendant: false,
      reason: "NO_TAKE_AND_BRING",
      checks: [],
    });
  });

  it("agendamento sem leva e traz segue mesmo sem a lista de ações", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ hasTakeAndBring: undefined })],
      chatbotActions: [],
    });

    expect(decision.sendToAttendant).toBe(false);
    expect(decision.reason).toBe("NO_TAKE_AND_BRING");
  });

  it("caso da loja 1045: leva e traz com 'Não oferecer e Falar com atendente' vai para o atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [
        bookingMenu,
        action("PET_SHOP", "DONT_OFFER_AND_SEND_TO_ATTENDANT"),
        humanSupport,
      ],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.reason).toBe("BEHAVIOR_SENDS_TO_ATTENDANT");
    expect(decision.checks).toEqual([
      {
        bookingId: 10282016,
        petName: "MEGGY",
        segmentType: "PET_SHOP",
        behaviors: ["DONT_OFFER_AND_SEND_TO_ATTENDANT"],
        outcome: "ATTENDANT_BEHAVIOR",
      },
    ]);
  });

  it("'Oferecer e Falar com atendente' também vai para o atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [action("PET_SHOP", "OFFER_AND_SEND_TO_ATTENDANT")],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.reason).toBe("BEHAVIOR_SENDS_TO_ATTENDANT");
  });

  it.each([
    ["OFFER_AND_SCHEDULE"],
    ["DONT_OFFER_AND_SCHEDULE"],
    [undefined],
  ])("comportamento %p agenda pelo bot: o reagendamento segue", (behavior) => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [action("PET_SHOP", behavior)],
    });

    expect(decision.sendToAttendant).toBe(false);
    expect(decision.reason).toBe("BEHAVIOR_ALLOWS");
    expect(decision.checks[0].outcome).toBe("ALLOWED_BEHAVIOR");
  });

  it("vale a ação do segmento do agendamento, não a de outro segmento", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ segmentType: "CLINIC" as never })],
      chatbotActions: [
        action("PET_SHOP", "DONT_OFFER_AND_SEND_TO_ATTENDANT"),
        action("CLINIC", "OFFER_AND_SCHEDULE"),
      ],
    });

    expect(decision.sendToAttendant).toBe(false);
    expect(decision.checks[0].behaviors).toEqual(["OFFER_AND_SCHEDULE"]);
  });

  it("sem a ação do segmento na lista vai para o atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [bookingMenu, humanSupport],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.reason).toBe("SEGMENT_ACTION_NOT_FOUND");
    expect(decision.checks[0].outcome).toBe("SEGMENT_ACTION_NOT_FOUND");
  });

  it("ação do segmento desativada conta como não encontrada", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [
        action("PET_SHOP", "OFFER_AND_SCHEDULE", { enabled: false }),
      ],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.reason).toBe("SEGMENT_ACTION_NOT_FOUND");
  });

  it("lista de ações vazia (variável não chegou ao fluxo) manda o leva e traz para o atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.reason).toBe("SEGMENT_ACTION_NOT_FOUND");
  });

  it("agendamento sem segmento não casa com nenhuma ação", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ segmentType: undefined })],
      chatbotActions: [action("PET_SHOP", "OFFER_AND_SCHEDULE")],
    });

    expect(decision.reason).toBe("SEGMENT_ACTION_NOT_FOUND");
  });

  it("duas ações habilitadas do mesmo segmento: basta uma mandar para o atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking()],
      chatbotActions: [
        action("PET_SHOP", "OFFER_AND_SCHEDULE"),
        action("PET_SHOP", "OFFER_AND_SEND_TO_ATTENDANT"),
      ],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.checks[0].behaviors).toEqual([
      "OFFER_AND_SCHEDULE",
      "OFFER_AND_SEND_TO_ATTENDANT",
    ]);
  });

  it("grupo: um pet com leva e traz para o atendente leva o grupo todo, e só ele entra na checagem", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [
        booking({ id: 1, petName: "JUDDY", hasTakeAndBring: false }),
        booking({ id: 2, petName: "JIMMY", hasTakeAndBring: true }),
      ],
      chatbotActions: [action("PET_SHOP", "DONT_OFFER_AND_SEND_TO_ATTENDANT")],
    });

    expect(decision.sendToAttendant).toBe(true);
    expect(decision.checks.map((check) => check.bookingId)).toEqual([2]);
  });

  it("aceita hasTakeAndBring como texto", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ hasTakeAndBring: "true" as never })],
      chatbotActions: [action("PET_SHOP", "DONT_OFFER_AND_SEND_TO_ATTENDANT")],
    });

    expect(decision.sendToAttendant).toBe(true);
  });

  it("sem agendamento utilizável vai para o atendente", () => {
    expect(
      resolveRescheduleTakeAndBring({ bookings: [], chatbotActions: [] }),
    ).toEqual({ sendToAttendant: true, reason: "NO_BOOKING", checks: [] });

    // O item "voltar ao menu" da lista de agendamentos não tem id.
    expect(
      resolveRescheduleTakeAndBring({
        bookings: [{ backToMenu: true } as never],
        chatbotActions: [],
      }).reason,
    ).toBe("NO_BOOKING");
  });
});

describe("parseObjectList", () => {
  const meggy = { id: 1, petName: "MEGGY", hasTakeAndBring: true };
  const bob = { id: 2, petName: "BOB", hasTakeAndBring: false };

  it("lista de strings JSON, como o Typebot injeta {{Grupo.Agendamentos}} e {{Acoes.Menu.Valores}}", () => {
    const raw = JSON.stringify([JSON.stringify(meggy), JSON.stringify(bob)]);

    expect(parseObjectList(raw)).toEqual([meggy, bob]);
  });

  it("objeto só, como chega o {{Agendamento.Selecionado}}", () => {
    expect(parseObjectList(JSON.stringify(meggy))).toEqual([meggy]);
  });

  it("lista de objetos e valores que não são texto", () => {
    expect(parseObjectList(JSON.stringify([meggy, bob]))).toEqual([meggy, bob]);
    expect(parseObjectList([meggy, JSON.stringify(bob)])).toEqual([meggy, bob]);
    expect(parseObjectList(meggy)).toEqual([meggy]);
  });

  it("entrada vazia ou inválida vira lista vazia, sem lançar", () => {
    expect(parseObjectList("")).toEqual([]);
    expect(parseObjectList("   ")).toEqual([]);
    expect(parseObjectList(undefined)).toEqual([]);
    expect(parseObjectList(null)).toEqual([]);
    expect(parseObjectList("{não é json")).toEqual([]);
    expect(parseObjectList(JSON.stringify(["{quebrado", 3, "texto"]))).toEqual(
      [],
    );
  });
});

describe("buildRescheduleTakeAndBringMessage", () => {
  it("põe o nome do pet do agendamento", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ petName: "TOBEY" })],
      chatbotActions: [action("PET_SHOP", "DONT_OFFER_AND_SEND_TO_ATTENDANT")],
    });

    expect(
      buildRescheduleTakeAndBringMessage(
        DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE,
        decision,
      ),
    ).toBe(
      "O agendamento de TOBEY tem leva e traz, então a remarcação é feita por um atendente. Vou te encaminhar 😊",
    );
  });

  it("no grupo, cita só os pets que levaram ao atendente", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [
        booking({ id: 1, petName: "JUDDY" }),
        booking({ id: 2, petName: "JIMMY", hasTakeAndBring: false }),
        booking({ id: 3, petName: "BIANCA" }),
      ],
      chatbotActions: [action("PET_SHOP", "OFFER_AND_SEND_TO_ATTENDANT")],
    });

    expect(buildRescheduleTakeAndBringMessage("{PET_NAME}", decision)).toBe(
      "JUDDY e BIANCA",
    );
  });

  it("sem nome do pet usa 'seu pet'", () => {
    const decision = resolveRescheduleTakeAndBring({
      bookings: [booking({ petName: undefined })],
      chatbotActions: [],
    });

    expect(
      buildRescheduleTakeAndBringMessage(
        "O agendamento de {PET_NAME} tem leva e traz.",
        decision,
      ),
    ).toBe("O agendamento de seu pet tem leva e traz.");
  });
});
