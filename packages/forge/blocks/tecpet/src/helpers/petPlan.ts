import {
  type PaPetPlanInvoiceControlResponse,
  type PaPetPlanResolution,
  type PaPetPlanResponse,
  type PaPlanBookingInput,
  PetPlanStatus,
  type ShopSegment,
  type TecpetSDK,
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
  TecpetApiError.PET_PLAN_NOT_FROM_PET,
  TecpetApiError.PET_PLAN_NOT_FROM_SHOP,
];

export const bookablePetPlanStatuses = [
  PetPlanStatus.ACTIVE,
  PetPlanStatus.PENDING,
  PetPlanStatus.OVERDUE,
];

const hasBalance = (control: PaPetPlanInvoiceControlResponse) =>
  control.used < control.quantity;

export const pickPetPlanFromList = (
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

export const pickPetPlanFromResolution = (
  resolution: PaPetPlanResolution | undefined,
): PaPlanBookingInput | undefined => {
  const recommendedId = resolution?.recommendedPetPlanId;

  if (!recommendedId) return undefined;

  const option = (resolution.options ?? []).find(
    (item) => Number(item.petPlanId) === Number(recommendedId),
  );

  if (!option?.coversAll) return undefined;

  const services = (option.services ?? [])
    .filter((service) => service.covered)
    .map((service) => Number(service.serviceId));

  if (!services.length) return undefined;

  return { petPlan: Number(option.petPlanId), services };
};

export const isRouteNotFoundError = (error: unknown): boolean =>
  Number((error as { statusCode?: unknown })?.statusCode) === 404;

export type PetPlanResolutionSource = "resolve" | "list";

export type ResolvedPetPlan = {
  plan: PaPlanBookingInput | undefined;
  source: PetPlanResolutionSource;
  optionsFound: number;
};

const resolveFromList = async (
  sdk: Pick<TecpetSDK, "petPlan">,
  petId: number,
  serviceIds: number[],
  shopId: number,
): Promise<ResolvedPetPlan> => {
  const petPlans = await sdk.petPlan.list(
    { petId, status: bookablePetPlanStatuses, vigente: true },
    shopId,
  );

  return {
    plan: pickPetPlanFromList(petPlans, serviceIds),
    source: "list",
    optionsFound: petPlans.length,
  };
};

export const resolvePetPlanForBooking = async ({
  sdk,
  petId,
  date,
  serviceIds,
  segmentType,
  shopId,
}: {
  sdk: Pick<TecpetSDK, "petPlan">;
  petId: number;
  date: string | undefined;
  serviceIds: number[];
  segmentType?: ShopSegment;
  shopId: number;
}): Promise<ResolvedPetPlan> => {
  if (!petId || !serviceIds.length)
    return { plan: undefined, source: "resolve", optionsFound: 0 };

  if (!date) return resolveFromList(sdk, petId, serviceIds, shopId);

  try {
    const resolution = await sdk.petPlan.resolve(
      {
        petId,
        date,
        serviceIds,
        ...(segmentType ? { segmentType } : {}),
      },
      shopId,
    );

    return {
      plan: pickPetPlanFromResolution(resolution),
      source: "resolve",
      optionsFound: resolution?.options?.length ?? 0,
    };
  } catch (error) {
    if (!isRouteNotFoundError(error)) throw error;

    return resolveFromList(sdk, petId, serviceIds, shopId);
  }
};
