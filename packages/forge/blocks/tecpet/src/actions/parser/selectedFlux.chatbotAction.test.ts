import { describe, expect, it } from "bun:test";
import { ParseSelectedFluxInfoCollectionMenusHandler } from "./selectedFlux.chatbotAction";

const CANCEL_HOURS_VAR = "varCancelHours";
const RESCHEDULE_HOURS_VAR = "varRescheduleHours";

const parseMinAdvanceHours = async (editBooking: Record<string, unknown>) => {
  const values = new Map<string, unknown>();

  await ParseSelectedFluxInfoCollectionMenusHandler({
    options: {
      selectedMenuConfigurations: JSON.stringify({
        name: "Consultar agendamentos",
        infoCollectionMenus: { editBooking },
      }),
      allowCancelMinAdvanceHours: CANCEL_HOURS_VAR,
      allowChangeDateAndTimeMinAdvanceHours: RESCHEDULE_HOURS_VAR,
    },
    variables: {
      set: (items: { id: string; value: unknown }[]) =>
        items.forEach(({ id, value }) => values.set(id, value)),
    },
  });

  return {
    cancel: values.get(CANCEL_HOURS_VAR),
    reschedule: values.get(RESCHEDULE_HOURS_VAR),
  };
};

describe("parseSelectedFluxInfoCollectionMenus — antecedência mínima", () => {
  it("grava o padrão de 1h quando a loja não configurou (TP-5238)", async () => {
    expect(
      await parseMinAdvanceHours({
        allowCancel: { enabled: true },
        allowChangeDateAndTime: { enabled: true },
      }),
    ).toEqual({ cancel: 1, reschedule: 1 });

    expect(
      await parseMinAdvanceHours({
        allowCancel: { enabled: true, minCancelAdvanceHours: null },
        allowChangeDateAndTime: {
          enabled: true,
          minRescheduleAdvanceHours: null,
        },
      }),
    ).toEqual({ cancel: 1, reschedule: 1 });
  });

  it("preserva o 0 explícito (sem restrição)", async () => {
    expect(
      await parseMinAdvanceHours({
        allowCancel: { enabled: true, minCancelAdvanceHours: 0 },
        allowChangeDateAndTime: { enabled: true, minRescheduleAdvanceHours: 0 },
      }),
    ).toEqual({ cancel: 0, reschedule: 0 });
  });

  it("preserva o valor configurado pela loja", async () => {
    expect(
      await parseMinAdvanceHours({
        allowCancel: { enabled: true, minCancelAdvanceHours: 24 },
        allowChangeDateAndTime: { enabled: true, minRescheduleAdvanceHours: 4 },
      }),
    ).toEqual({ cancel: 24, reschedule: 4 });
  });
});
