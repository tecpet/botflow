import type { PaEmployeeIndication } from "@tec.pet/tecpet-sdk";

/**
 * Serviço do agendamento, no mínimo que a indicação usa. Tipado aqui, e não
 * pelo `PaGetBookingResponse`, porque a API devolve `categoryId` e `employee`
 * independentemente da versão do SDK em que o bloco está preso.
 */
export type RescheduleBookingServiceRef = {
  id?: number;
  categoryId?: number | null;
  employee?: { id?: number | null } | null;
};

/**
 * Indicação de funcionários para reagendar com o mesmo profissional do
 * agendamento (TP-4662).
 *
 * O `PUT /booking/{id}/reschedule` não recebe funcionário: o profissional viaja
 * dentro do `timeId` que o `availableTimes` devolveu, e o servidor recria os
 * jobs a partir dele. Sem indicação, o algoritmo escolhia qualquer profissional
 * livre e o pet trocava de profissional ao reagendar. Por isso a indicação vai
 * na busca de horários, montada a partir do profissional alocado em cada
 * serviço (`services[].employee`).
 *
 * Serviço sem profissional alocado (creche, serviço sem duração) fica de fora:
 * a categoria dele segue aberta para qualquer profissional.
 */
export const buildRescheduleEmployeeIndication = (
  booking:
    | { services?: RescheduleBookingServiceRef[] | null }
    | null
    | undefined,
): PaEmployeeIndication[] => {
  const indications: PaEmployeeIndication[] = [];

  for (const service of booking?.services ?? []) {
    const employeeId = Number(service?.employee?.id);
    const serviceCategoryId = Number(service?.categoryId);

    if (!Number.isInteger(employeeId) || employeeId <= 0) continue;
    if (!Number.isInteger(serviceCategoryId) || serviceCategoryId <= 0)
      continue;

    const alreadyIndicated = indications.some(
      (indication) =>
        indication.id === employeeId &&
        indication.serviceCategoryId === serviceCategoryId,
    );

    if (!alreadyIndicated)
      indications.push({ id: employeeId, serviceCategoryId });
  }

  return indications;
};
