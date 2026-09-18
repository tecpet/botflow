import type {
  PaGetBookingResponse,
  PaGetServicePricingResponse,
  PaServiceCategoryResponse,
  PaServicePricingResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler, summarizeArray } from "../../helpers/logger";
import { parseJsonArray, safeJsonParse } from "../../helpers/utils";
import type { ServiceOptionType } from "./buildServiceOptions";

/**
 * Ponte entre o reagendamento e a seleção de funcionário (TP-3792).
 *
 * O "Buscar Funcionários" pede um `ServiceOptionType` — o objeto rico que o
 * `buildServiceOptions` monta durante a criação — porque precisa do **id** da
 * categoria de cada serviço para filtrar `/employee/list`. No reagendamento não
 * existe nada disso: o que se tem é o agendamento, cujos serviços trazem
 * `categoryType` (o tipo) mas não o id da categoria.
 *
 * Em vez de duplicar a derivação de categorias, esta ação devolve um
 * `ServiceOptionType` sintético do tipo COMBO. O ramo COMBO do "Buscar
 * Funcionários" já percorre `services[].serviceCategory` e é exatamente o que
 * precisamos — então ele roda sem nenhuma alteração, e a regra de quais
 * categorias pedem profissional continua vivendo num lugar só.
 *
 * A categoria vem do catálogo (`categoriesAndServices`), não do campo aninhado
 * `serviceCategory` de cada serviço: aquele é opcional na resposta da API e,
 * quando os serviços chegam agrupados por categoria, costuma vir ausente —
 * montar a partir do pai é o que sempre tem id.
 */
export const buildBookingServiceSelection = createAction({
  baseOptions,
  name: "Montar serviço do agendamento para seleção de funcionário",
  options: option.object({
    booking: option.string.layout({
      label: "Agendamento selecionado",
      isRequired: true,
      helperText: "Agendamento que está sendo reagendado",
    }),
    categoriesAndServices: option.string.layout({
      label: "Categorias com serviços",
      isRequired: true,
      helperText:
        "Catálogo da loja, usado para resolver a categoria de cada serviço",
    }),
    selectedService: option.string.layout({
      label: "Serviço selecionado (saída)",
      isRequired: true,
      helperText:
        "Recebe o serviço no formato esperado pelo 'Buscar Funcionários'",
      inputType: "variableDropdown",
    }),
    hasServiceCategories: option.string.layout({
      label: "Encontrou categorias (saída)",
      helperText:
        "Recebe true quando ao menos uma categoria foi resolvida; false evita abrir uma seleção vazia",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ selectedService, hasServiceCategories }) => {
    const variables: Array<string> = [];

    if (selectedService) variables.push(selectedService);
    if (hasServiceCategories) variables.push(hasServiceCategories);

    return variables;
  },
});

export const BuildBookingServiceSelectionHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  // As duas saídas são gravadas em todos os caminhos, inclusive no catch. Uma
  // variável não gravada faz o fluxo reentrar no bloco (lição da TP-3635).
  const setOutcome = (
    selectedService: ServiceOptionType | string,
    hasServiceCategories: boolean,
  ) => {
    if (options.selectedService) {
      variables.set([
        { id: options.selectedService as string, value: selectedService },
      ]);
    }

    if (options.hasServiceCategories) {
      variables.set([
        {
          id: options.hasServiceCategories as string,
          value: hasServiceCategories,
        },
      ]);
    }
  };

  try {
    const booking = safeJsonParse<PaGetBookingResponse | null>(
      options.booking,
      null,
    );

    if (!booking) {
      logHandler("buildBookingServiceSelection", {
        failed: true,
        reason: "booking ausente ou inválido",
      });
      setOutcome("", false);
      return;
    }

    const categories = parseJsonArray<PaGetServicePricingResponse>(
      options.categoriesAndServices,
    );

    // serviceId -> categoria do catálogo
    const categoryByServiceId = new Map<number, PaServiceCategoryResponse>();

    for (const category of categories) {
      for (const service of category.services ?? []) {
        categoryByServiceId.set(Number(service.id), {
          id: category.id,
          name: category.name,
          type: category.type,
        });
      }
    }

    const bookingServices = booking.services ?? [];

    const services: PaServicePricingResponse[] = [];
    const unresolved: Array<{ id: number; name: string }> = [];

    for (const bookingService of bookingServices) {
      const serviceCategory = categoryByServiceId.get(
        Number(bookingService.id),
      );

      if (!serviceCategory) {
        unresolved.push({ id: bookingService.id, name: bookingService.name });
        continue;
      }

      services.push({
        id: bookingService.id,
        name: bookingService.name,
        price: 0,
        description: "",
        orientation: "",
        serviceCategory,
      });
    }

    logHandler("buildBookingServiceSelection", {
      bookingId: booking.id,
      inputServices: summarizeArray(
        bookingServices.map((service) => ({
          id: service.id,
          name: service.name,
        })),
      ),
      resolvedCategories: summarizeArray(
        services.map((service) => ({
          serviceId: service.id,
          categoryId: service.serviceCategory.id,
          categoryType: service.serviceCategory.type,
        })),
      ),
      unresolvedServices: summarizeArray(unresolved),
    });

    if (!services.length) {
      // Serviço fora do catálogo atual (desativado, trocado de categoria). Sem
      // categoria não há como filtrar profissional — o fluxo segue para os
      // horários sem a etapa, em vez de oferecer uma lista vazia.
      setOutcome("", false);
      return;
    }

    // Sempre COMBO, mesmo com um único serviço: é o ramo do "Buscar
    // Funcionários" que lê `services[].serviceCategory`. O ramo SERVICE leria
    // `category`, que aqui seria uma categoria só — e perderia a tosa quando o
    // agendamento tem banho + tosa.
    const selectedService: ServiceOptionType = {
      id: booking.id,
      name: services.map((service) => service.name).join(" + "),
      price: 0,
      description: "",
      type: "COMBO",
      category: null as any,
      services,
    };

    setOutcome(selectedService, true);
  } catch (error) {
    console.error(error);
    logHandler("buildBookingServiceSelection", { failed: true });
    setOutcome("", false);
  }
};
