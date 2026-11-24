import { describe, expect, it } from "bun:test";
import {
  DEFAULT_RESCHEDULE_TAKE_AND_BRING_FAILED_MESSAGE,
  DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE,
} from "../../helpers/rescheduleTakeAndBring";
import { VerifyRescheduleTakeAndBringHandler } from "./verifyRescheduleTakeAndBring";

const SEND_TO_ATTENDANT_VAR = "vSendToAttendant";
const MESSAGE_VAR = "vAttendantMessage";

/** Guarda o que o handler gravou, como o `variables.set` do Forge. */
const fakeVariables = () => {
  const values = new Map<string, unknown>();

  return {
    values,
    set: (items: { id: string; value: unknown }[]) => {
      for (const { id, value } of items) values.set(id, value);
    },
  };
};

/**
 * O formato em que o Typebot injeta as variáveis nas opções do bloco: a lista
 * de ações vira o JSON de uma lista de strings JSON, e o agendamento
 * selecionado vira o JSON do objeto.
 */
const menuValues = (behavior: string) =>
  JSON.stringify(
    [
      { id: "a1", actionType: "BOOKING", enabled: true },
      {
        id: "a2",
        actionType: "PET_SHOP",
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
      },
    ].map((item) => JSON.stringify(item)),
  );

const selectedBooking = (hasTakeAndBring: boolean) =>
  JSON.stringify({
    id: 10282016,
    petId: 1023398,
    petName: "MEGGY",
    segmentType: "PET_SHOP",
    hasTakeAndBring,
    date: "18/11",
    start: "09:30",
    services: [{ id: 5101, name: "Banho" }],
    combos: [],
  });

const run = async (options: Record<string, unknown>) => {
  const variables = fakeVariables();

  await VerifyRescheduleTakeAndBringHandler({
    options: {
      sendToAttendant: SEND_TO_ATTENDANT_VAR,
      attendantMessage: MESSAGE_VAR,
      ...options,
    },
    variables,
  });

  return {
    sendToAttendant: variables.values.get(SEND_TO_ATTENDANT_VAR),
    message: variables.values.get(MESSAGE_VAR),
  };
};

describe("VerifyRescheduleTakeAndBringHandler", () => {
  it("leva e traz com 'Não oferecer e Falar com atendente': encaminha com o nome do pet", async () => {
    expect(
      await run({
        bookings: selectedBooking(true),
        chatbotActions: menuValues("DONT_OFFER_AND_SEND_TO_ATTENDANT"),
      }),
    ).toEqual({
      sendToAttendant: true,
      message: DEFAULT_RESCHEDULE_TAKE_AND_BRING_MESSAGE.replace(
        "{PET_NAME}",
        "MEGGY",
      ),
    });
  });

  it("sem leva e traz grava false e mensagem vazia", async () => {
    expect(
      await run({
        bookings: selectedBooking(false),
        chatbotActions: menuValues("DONT_OFFER_AND_SEND_TO_ATTENDANT"),
      }),
    ).toEqual({ sendToAttendant: false, message: "" });
  });

  it("'Oferecer e Agendar' deixa reagendar", async () => {
    expect(
      await run({
        bookings: selectedBooking(true),
        chatbotActions: menuValues("OFFER_AND_SCHEDULE"),
      }),
    ).toEqual({ sendToAttendant: false, message: "" });
  });

  it("usa a mensagem configurada no bloco", async () => {
    const result = await run({
      bookings: selectedBooking(true),
      chatbotActions: menuValues("OFFER_AND_SEND_TO_ATTENDANT"),
      message: "  Remarcação de {PET_NAME} só com atendente.  ",
    });

    expect(result.message).toBe("Remarcação de MEGGY só com atendente.");
  });

  it("agendamento vazio (variável errada no bloco) encaminha com a mensagem de falha", async () => {
    expect(
      await run({
        bookings: "",
        chatbotActions: menuValues("OFFER_AND_SCHEDULE"),
      }),
    ).toEqual({
      sendToAttendant: true,
      message: DEFAULT_RESCHEDULE_TAKE_AND_BRING_FAILED_MESSAGE,
    });
  });

  it("reagendamento em grupo lê a lista {{Grupo.Agendamentos}}", async () => {
    const groupBookings = JSON.stringify(
      [
        {
          id: 1,
          petName: "JUDDY",
          segmentType: "PET_SHOP",
          hasTakeAndBring: false,
        },
        {
          id: 2,
          petName: "JIMMY",
          segmentType: "PET_SHOP",
          hasTakeAndBring: true,
        },
      ].map((item) => JSON.stringify(item)),
    );

    const result = await run({
      bookings: groupBookings,
      chatbotActions: menuValues("DONT_OFFER_AND_SEND_TO_ATTENDANT"),
    });

    expect(result.sendToAttendant).toBe(true);
    expect(result.message).toContain("JIMMY");
    expect(result.message).not.toContain("JUDDY");
  });
});
