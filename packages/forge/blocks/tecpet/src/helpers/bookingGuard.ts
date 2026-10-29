import {
  type BookingGuardRuleResponseDto,
  BookingGuardScopeEnum,
  type PaBookingGuardValidationResponseDto,
} from "@tec.pet/tecpet-sdk";
import type { ServiceOptionType } from "../actions/internal/buildServiceOptions";
import { describeApiError } from "./apiErrors";

/** Escopos de restrição de agenda que valem para o chatbot. */
export const BOT_GUARD_SCOPES = [
  BookingGuardScopeEnum.BOT,
  BookingGuardScopeEnum.BOTH,
];

/**
 * Serviços contra os quais a restrição de agenda é avaliada.
 *
 * Tem que ser o MESMO conjunto que o `createBooking` vai gravar (principal +
 * leva e traz + adicionais). Validar só o principal era o bug da TP-4170:
 * restrição sobre um serviço que o fluxo só oferece como "mimo extra" nunca era
 * testada, e o agendamento passava. A busca de horários e a confirmação usam
 * esta mesma função para que a lista nunca ofereça um dia que a confirmação
 * barra (TP-4889).
 */
export const buildGuardServiceIds = ({
  selectedService,
  catalogServiceIds,
  selectedAdditionalIds,
  takeAndBringId,
}: {
  selectedService: Pick<ServiceOptionType, "id" | "type" | "services">;
  catalogServiceIds: number[];
  selectedAdditionalIds: number[];
  takeAndBringId: number | null;
}): { services: number[]; comboServiceIds: number[] } => {
  const services: number[] = [];
  const selectedId = Number(selectedService.id);

  let comboServiceIds: number[] = [];

  if (selectedService.type === "COMBO") {
    // O endpoint de restrição só aceita `servicesId` — não existe `combosId`
    // no contrato. Então o combo é expandido nos serviços que o compõem, que já
    // vêm no próprio objeto montado por `buildServiceOptions`. Sem isso o combo
    // saía com a lista vazia e escapava de qualquer restrição de serviço.
    comboServiceIds = (selectedService.services ?? []).map((service) =>
      Number(service.id),
    );

    services.push(...comboServiceIds);
  } else if (catalogServiceIds.includes(selectedId)) {
    services.push(selectedId);
  }

  services.push(...selectedAdditionalIds);

  if (takeAndBringId) services.push(takeAndBringId);

  // Dedup e descarte de ids inválidos: o combo pode repetir um serviço já
  // escolhido como adicional, e o id sentinela -1 ("VER OUTROS SERVIÇOS") não
  // pode chegar na consulta.
  const uniqueServices = [...new Set(services)].filter(
    (id) => Number.isFinite(id) && id > 0,
  );

  return { services: uniqueServices, comboServiceIds };
};

type GuardDateCheck =
  | { status: "blocked"; guard: BookingGuardRuleResponseDto | null }
  | { status: "allowed" }
  | { status: "failed"; error: string };

export type BookingGuardDateFilter = {
  /** Datas que a restrição barra, com a restrição que barrou. */
  blockedDates: Map<string, BookingGuardRuleResponseDto | null>;
  /**
   * A janela tinha data barrada, mas nenhum dia da semana passou na validação:
   * a restrição não depende da data (ou não deu para provar que depende).
   */
  dateIndependent: boolean;
  /** Datas cuja validação falhou, com o erro. Ficam na lista. */
  failedDates: { dateISO: string; error: string }[];
};

const DAYS_IN_WEEK = 7;

const addDaysISO = (dateISO: string, days: number) => {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const weekdayOf = (dateISO: string) =>
  new Date(`${dateISO}T00:00:00Z`).getUTCDay();

const checkDates = async (
  dates: string[],
  validate: (
    dateISO: string,
  ) => Promise<PaBookingGuardValidationResponseDto | null>,
): Promise<[string, GuardDateCheck][]> =>
  Promise.all(
    dates.map(async (dateISO): Promise<[string, GuardDateCheck]> => {
      try {
        const validation = await validate(dateISO);

        return [
          dateISO,
          validation?.blocked
            ? { status: "blocked", guard: validation.guard ?? null }
            : { status: "allowed" },
        ];
      } catch (error) {
        return [dateISO, { status: "failed", error: describeApiError(error) }];
      }
    }),
  );

/**
 * Datas da janela de busca que a restrição de agenda barra, para a lista de
 * horários não oferecer um dia que a confirmação vai recusar (TP-4889).
 *
 * Uma restrição barra quando todos os seus critérios batem, e o único critério
 * que depende da data do agendamento é o dia da semana. Então, para o mesmo
 * pet, serviços e segmento, o resultado só muda conforme o dia da semana.
 *
 * Isso permite separar dois casos que a validação de uma data só não separa:
 * - "Tosa na tesoura no sábado": barra só alguns dias da semana. Esses dias
 *   saem da lista e o cliente escolhe entre os que sobram.
 * - "Tosa completa só com atendente" (sem dia da semana): barra todos os dias.
 *   Filtrar aqui esvaziaria toda a agenda, o fluxo cairia em "sem horários" e a
 *   mensagem da restrição se perderia. Nesse caso a lista fica como está e a
 *   validação da confirmação barra com a mensagem da própria restrição.
 *
 * O caminho comum custa uma validação por data da janela. Só quando nenhuma
 * data da janela passa a semana inteira é validada, para saber em qual caso
 * estamos.
 *
 * Falha da validação mantém a data: a confirmação valida de novo e bloqueia por
 * precaução, então esconder agenda aqui por uma falha só tiraria opções do
 * cliente.
 */
export const resolveBookingGuardBlockedDates = async ({
  dates,
  validate,
}: {
  dates: string[];
  validate: (
    dateISO: string,
  ) => Promise<PaBookingGuardValidationResponseDto | null>;
}): Promise<BookingGuardDateFilter> => {
  const checks = new Map(await checkDates(dates, validate));

  const failedDates = () =>
    [...checks].flatMap(([dateISO, check]) =>
      check.status === "failed" ? [{ dateISO, error: check.error }] : [],
    );

  const blockedInWindow = dates.filter(
    (dateISO) => checks.get(dateISO)?.status === "blocked",
  );

  if (blockedInWindow.length === 0)
    return {
      blockedDates: new Map(),
      dateIndependent: false,
      failedDates: failedDates(),
    };

  const someWeekdayAllowed = () =>
    [...checks.values()].some((check) => check.status === "allowed");

  // Com um dia liberado na própria janela, já está provado que a restrição
  // depende do dia. Senão, completa a semana com uma data para cada dia da
  // semana que a janela não cobriu (data validada vale pelo dia da semana).
  if (!someWeekdayAllowed()) {
    const checkedWeekdays = new Set([...checks.keys()].map(weekdayOf));
    const missingWeekdays = Array.from({ length: DAYS_IN_WEEK }, (_, offset) =>
      addDaysISO(dates[0], offset),
    ).filter((dateISO) => !checkedWeekdays.has(weekdayOf(dateISO)));

    for (const [dateISO, check] of await checkDates(missingWeekdays, validate))
      checks.set(dateISO, check);
  }

  if (!someWeekdayAllowed())
    return {
      blockedDates: new Map(),
      dateIndependent: true,
      failedDates: failedDates(),
    };

  return {
    blockedDates: new Map(
      blockedInWindow.map((dateISO) => {
        const check = checks.get(dateISO);

        return [dateISO, check?.status === "blocked" ? check.guard : null];
      }),
    ),
    dateIndependent: false,
    failedDates: failedDates(),
  };
};
