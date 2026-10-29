import type {
  PaPetPlanInvoiceControlResponse,
  PaPetPlanResponse,
  PaPlanBookingInput,
} from "@tec.pet/tecpet-sdk";
import { TecpetApiError } from "./apiErrors";

/**
 * Recusas de plano que o servidor devolve ao criar o agendamento. Qualquer uma
 * delas significa só que o plano não cobre este agendamento: o bloco repete a
 * criação sem `plan` e o agendamento sai avulso, como antes da TP-4568.
 *
 * Todas são checadas antes de qualquer gravação no `createBooking` do servidor,
 * então repetir não duplica o agendamento.
 */
export const petPlanRefusalErrors = [
  TecpetApiError.PET_PLAN_NOT_FOUND,
  TecpetApiError.PET_PLAN_IS_CANCELED,
  TecpetApiError.PET_PLAN_IS_FULL,
  TecpetApiError.PET_PLAN_WITHOUT_VALID_INVOICE,
  TecpetApiError.PET_PLAN_WITHOUT_PAID_INVOICES,
  TecpetApiError.PET_PLAN_SERVICES_NOT_AVAILABLE,
  TecpetApiError.BOOKING_DATE_AFTER_PET_PLAN_END_DATE,
  TecpetApiError.BOOKING_DATE_BEFORE_PET_PLAN_START_DATE,
];

const hasBalance = (control: PaPetPlanInvoiceControlResponse) =>
  control.used < control.quantity;

/**
 * Escolhe o plano do pet que cobre o serviço escolhido, espelhando o painel
 * (tecpet-web, `markServicesWithPetPlan` / `verifyAndDisableCombosWithServicesInPlan`):
 *
 * - Serviço: vincula quando a fatura atual do plano tem saldo para ele.
 * - Combo: vincula quando algum serviço do combo tem saldo e nenhum serviço do
 *   combo que está no plano está esgotado — o painel desabilita esse combo no
 *   modo plano. Com um serviço coberto o servidor tira o desconto do combo e
 *   cobra os demais pelo preço avulso.
 *
 * Adicionais e leva e traz ficam de fora, como no V1. A decisão final é do
 * servidor, que escolhe a fatura pelo ciclo da data do agendamento; a fatura
 * atual aqui é só a melhor aproximação, e por isso existe o fallback para
 * avulso em `petPlanRefusalErrors`.
 */
export const resolvePetPlanForBooking = (
  petPlans: PaPetPlanResponse[],
  serviceIds: number[],
): PaPlanBookingInput | undefined => {
  if (!serviceIds.length) return undefined;

  for (const petPlan of petPlans) {
    const invoices = petPlan.invoices ?? [];
    const invoice = invoices.find((item) => item.current) ?? invoices[0];

    const controls = (invoice?.control ?? []).filter((control) =>
      serviceIds.includes(Number(control.serviceId)),
    );

    if (!controls.length || !controls.every(hasBalance)) continue;

    return {
      petPlan: petPlan.id,
      services: controls.map((control) => Number(control.serviceId)),
    };
  }

  return undefined;
};
