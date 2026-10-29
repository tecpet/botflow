import type {
  PaEmployeeIndication,
  PaEmployeeResponse,
  TecpetSDK,
} from "@tec.pet/tecpet-sdk";
import { describeApiError } from "./apiErrors";
import { logHandler } from "./logger";

/**
 * Serviço do agendamento, no mínimo que a indicação usa. Tipado aqui, e não
 * pelo `PaGetBookingResponse`, porque a API devolve `categoryId` e `employee`
 * independentemente da versão do SDK em que o bloco está preso.
 */
export type RescheduleBookingServiceRef = {
  id?: number;
  categoryId?: number | null;
  employee?: { id?: number | null; name?: string | null } | null;
};

type RescheduleBookingRef =
  | { services?: RescheduleBookingServiceRef[] | null }
  | null
  | undefined;

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
  booking: RescheduleBookingRef,
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

/**
 * Por que o profissional do agendamento ficou de fora da busca (TP-4863).
 *
 * - `NO_TIMES`: ele segue atendendo a categoria, só não tem horário nos dias
 *   buscados (agenda cheia, folga, bloqueio). Outras datas podem ter.
 * - `EMPLOYEE_UNAVAILABLE`: está inativo ou não atende mais a categoria.
 *   Nenhuma data vai ter horário com ele, então o fluxo não pode oferecer
 *   "outra data com o mesmo profissional".
 */
export enum EmployeeFallbackReason {
  NO_TIMES = "NO_TIMES",
  EMPLOYEE_UNAVAILABLE = "EMPLOYEE_UNAVAILABLE",
}

const isSameIndication = (
  first: PaEmployeeIndication,
  second: PaEmployeeIndication,
) =>
  first.id === second.id &&
  first.serviceCategoryId === second.serviceCategoryId;

const withoutIndications = (
  indication: PaEmployeeIndication[],
  removed: PaEmployeeIndication[],
) =>
  indication.filter(
    (item) => !removed.some((other) => isSameIndication(item, other)),
  );

/**
 * Indicações intermediárias a tentar antes de buscar com qualquer profissional,
 * da mais próxima do agendamento para a mais distante.
 *
 * Primeiro sai quem comprovadamente não atende mais (`unavailable`). Depois sai
 * um profissional por vez: num Banho (Maria) + Tosa (João) com só a Maria
 * bloqueada, a tentativa "sem a Maria" acha horário e o João continua na Tosa.
 * Antes, o fallback trocava os dois.
 *
 * A indicação original e a vazia não entram na lista: a original já foi
 * tentada, e a vazia é o último recurso de quem chama.
 */
export const buildRelaxedIndications = (
  indication: PaEmployeeIndication[],
  unavailable: PaEmployeeIndication[],
): PaEmployeeIndication[][] => {
  const available = withoutIndications(indication, unavailable);
  const candidates: PaEmployeeIndication[][] = [];

  if (available.length < indication.length) candidates.push(available);

  if (available.length > 1)
    for (const skipped of available)
      candidates.push(withoutIndications(available, [skipped]));

  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (candidate.length === 0) return false;

    const key = candidate
      .map((item) => `${item.id}:${item.serviceCategoryId}`)
      .sort()
      .join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export type RescheduleEmployeeSearch<T> = {
  /** Resultado que vale: o da busca preferida ou o do fallback. */
  result: T;
  /** Indicação usada para chegar nesse resultado. */
  indication: PaEmployeeIndication[];
  /** Indicações do agendamento que ficaram de fora (profissionais trocados). */
  dropped: PaEmployeeIndication[];
  /** Motivo da troca; `null` quando o resultado mantém todos os profissionais. */
  reason: EmployeeFallbackReason | null;
};

/**
 * Busca de horários da remarcação que trata o profissional do agendamento como
 * preferência, não como requisito (TP-4662, TP-4863).
 *
 * 1. Busca com a indicação completa. Se achou horário, ou se não há indicação,
 *    termina aqui.
 * 2. Descobre quem não atende mais a categoria (`findUnavailable`).
 * 3. Tenta as indicações intermediárias de `buildRelaxedIndications`.
 * 4. Último recurso: busca com qualquer profissional.
 *
 * Os passos 2 a 4 só rodam quando a busca preferida volta vazia, então o
 * caminho comum continua custando uma busca só.
 */
export const searchKeepingRescheduleEmployees = async <T>({
  indication,
  search,
  hasTimes,
  findUnavailable,
}: {
  indication: PaEmployeeIndication[];
  search: (indication: PaEmployeeIndication[]) => Promise<T>;
  hasTimes: (result: T) => boolean;
  findUnavailable: (
    indication: PaEmployeeIndication[],
  ) => Promise<PaEmployeeIndication[]>;
}): Promise<RescheduleEmployeeSearch<T>> => {
  const preferred = await search(indication);

  if (indication.length === 0 || hasTimes(preferred))
    return { result: preferred, indication, dropped: [], reason: null };

  const unavailable = await findUnavailable(indication);
  const reason =
    unavailable.length > 0
      ? EmployeeFallbackReason.EMPLOYEE_UNAVAILABLE
      : EmployeeFallbackReason.NO_TIMES;

  for (const candidate of buildRelaxedIndications(indication, unavailable)) {
    const result = await search(candidate);

    if (hasTimes(result))
      return {
        result,
        indication: candidate,
        dropped: withoutIndications(indication, candidate),
        reason,
      };
  }

  return {
    result: await search([]),
    indication: [],
    dropped: indication,
    reason,
  };
};

// A rota pagina (padrão de 20 por página). Na prática nenhuma categoria tem
// tantos profissionais; o teto alto evita classificar como inativo quem só
// cairia na página 2.
const EMPLOYEE_LIST_LIMIT = 200;

/**
 * Indicações cujo profissional não atende mais a categoria, seja porque está
 * inativo, seja porque foi retirado dela. A lista de funcionários da Public API
 * (`/employee/list`) já vem filtrada por `active` e pela categoria.
 *
 * Não dá para deduzir isso do erro `NO_EMPLOYEE_TO_SERVICE` da busca de
 * horários. Esse erro também aparece quando o profissional indicado está
 * bloqueado o dia inteiro e o agendamento tem outra categoria: o outro
 * profissional sobra, e a categoria do bloqueado fica descoberta.
 *
 * Se a consulta falhar, ninguém é classificado como indisponível. Na dúvida, o
 * motivo fica `NO_TIMES`, que não impede o fluxo de oferecer o profissional
 * depois.
 */
export const findUnavailableIndications = async (
  tecpetSdk: TecpetSDK,
  shopId: number,
  indication: PaEmployeeIndication[],
): Promise<PaEmployeeIndication[]> => {
  const unavailable: PaEmployeeIndication[] = [];
  const serviceCategoryIds = [
    ...new Set(indication.map((item) => item.serviceCategoryId)),
  ];

  for (const serviceCategoryId of serviceCategoryIds) {
    try {
      const employees = await tecpetSdk.employee.getEmployeesByServiceCategory(
        { serviceCategoryIds: [serviceCategoryId], limit: EMPLOYEE_LIST_LIMIT },
        shopId,
      );
      const activeEmployeeIds = new Set(
        employees.map((employee) => Number(employee.id)),
      );

      unavailable.push(
        ...indication.filter(
          (item) =>
            item.serviceCategoryId === serviceCategoryId &&
            !activeEmployeeIds.has(item.id),
        ),
      );
    } catch (error) {
      logHandler("findUnavailableIndications", {
        shopId,
        serviceCategoryId,
        employeeListFailed: true,
        error: describeApiError(error),
      });
    }
  }

  return unavailable;
};

/** Profissionais ativos de cada categoria, pelo id da categoria. */
export type CategoryEmployees = Map<
  number,
  Array<Pick<PaEmployeeResponse, "id" | "name">>
>;

/**
 * Profissionais ativos de cada categoria da indicação, pelo `/employee/list`,
 * para dizer com quem são os horários restritos e se há outro profissional
 * para oferecer (TP-5050). Categoria cuja consulta falhou fica fora do mapa, e
 * quem usa decide o que vale na dúvida.
 */
export const listIndicationCategoryEmployees = async (
  tecpetSdk: TecpetSDK,
  shopId: number,
  indication: PaEmployeeIndication[],
): Promise<CategoryEmployees> => {
  const employeesByCategory: CategoryEmployees = new Map();
  const serviceCategoryIds = [
    ...new Set(indication.map((item) => item.serviceCategoryId)),
  ];

  for (const serviceCategoryId of serviceCategoryIds) {
    try {
      employeesByCategory.set(
        serviceCategoryId,
        await tecpetSdk.employee.getEmployeesByServiceCategory(
          {
            serviceCategoryIds: [serviceCategoryId],
            limit: EMPLOYEE_LIST_LIMIT,
          },
          shopId,
        ),
      );
    } catch (error) {
      logHandler("listIndicationCategoryEmployees", {
        shopId,
        serviceCategoryId,
        employeeListFailed: true,
        error: describeApiError(error),
      });
    }
  }

  return employeesByCategory;
};

/**
 * Nomes dos profissionais que o cliente escolheu na lista, para o anúncio
 * "Esses são os horários disponíveis com a Maria" (TP-5050). A indicação da
 * escolha só traz ids, então o nome vem da lista de cada categoria. Seguem a
 * ordem da indicação, sem repetição.
 *
 * Só devolve nomes quando resolve todos. Com um nome faltando, o anúncio diria
 * menos do que a lista mostra; sem nenhum, o fluxo só deixa de anunciar.
 */
export const resolveIndicatedEmployeeNames = (
  employeesByCategory: CategoryEmployees,
  indication: PaEmployeeIndication[],
): string[] => {
  const nameById = new Map<number, string>();

  for (const employees of employeesByCategory.values())
    for (const employee of employees) {
      const name = employee.name?.trim();

      if (name) nameById.set(Number(employee.id), name);
    }

  const names: string[] = [];

  for (const item of indication) {
    const name = nameById.get(item.id);

    if (!name) {
      logHandler("resolveIndicatedEmployeeNames", {
        employeeId: item.id,
        missingName: true,
      });
      return [];
    }

    if (!names.includes(name)) names.push(name);
  }

  return names;
};

/**
 * Se alguma categoria da indicação tem outro profissional ativo além dos
 * indicados. Sem nenhum, "VER OUTROS PROFISSIONAIS" mostraria os mesmos
 * horários, e o fluxo não oferece a opção (TP-5050).
 *
 * Categoria cuja consulta falhou conta como tendo outro: era assim antes da
 * checagem, e uma opção a mais não deixa o cliente sem horário.
 */
export const hasOtherCategoryEmployees = (
  employeesByCategory: CategoryEmployees,
  indication: PaEmployeeIndication[],
): boolean => {
  const serviceCategoryIds = [
    ...new Set(indication.map((item) => item.serviceCategoryId)),
  ];

  return serviceCategoryIds.some((serviceCategoryId) => {
    const employees = employeesByCategory.get(serviceCategoryId);

    if (!employees) return true;

    const indicatedIds = new Set(
      indication
        .filter((item) => item.serviceCategoryId === serviceCategoryId)
        .map((item) => item.id),
    );

    return employees.some((employee) => !indicatedIds.has(Number(employee.id)));
  });
};

/**
 * Indicação a que os horários da remarcação ficaram restritos: a do próprio
 * agendamento, quando a busca achou horário sem trocar ninguém (TP-5050).
 *
 * A troca só acontece quando a janela inteira fica vazia, então um dia em que só
 * o profissional do agendamento está sem vaga some da lista. O fluxo usa esta
 * indicação para dizer com quem são os horários e oferecer "VER OUTROS
 * PROFISSIONAIS". Quando houve troca, a lista já não é só do agendamento e o
 * aviso de troca cobre a mensagem.
 */
export const resolveRestrictedIndication = <T>(
  search: RescheduleEmployeeSearch<T> | null,
): PaEmployeeIndication[] =>
  search && search.dropped.length === 0 ? search.indication : [];

/**
 * Nomes dos profissionais do agendamento que estão em `indication`, para a
 * mensagem dizer com quem é (ou com quem não há) horário: os que ficaram de
 * fora da busca ("a Maria não tem horário nesses dias") ou aqueles a que a
 * lista ficou restrita ("horários disponíveis com a Maria"). Seguem a ordem dos
 * serviços, sem repetição.
 */
export const resolveBookingEmployeeNames = (
  booking: RescheduleBookingRef,
  indication: PaEmployeeIndication[],
): string[] => {
  const names: string[] = [];

  for (const service of booking?.services ?? []) {
    const name = service?.employee?.name?.trim();
    const isIndicated = indication.some(
      (item) =>
        item.id === Number(service?.employee?.id) &&
        item.serviceCategoryId === Number(service?.categoryId),
    );

    if (isIndicated && name && !names.includes(name)) names.push(name);
  }

  return names;
};
