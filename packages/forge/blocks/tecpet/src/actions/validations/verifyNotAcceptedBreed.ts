import type {
  PaPetResponse,
  PaShopConfigurationsResponse,
} from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { baseOptions } from "../../constants";
import { logHandler } from "../../helpers/logger";
import { safeJsonParse } from "../../helpers/utils";

const defaultNotAcceptedMessage = "Raça não aceita no estabelecimento";

export const verifyNotAcceptedBreed = createAction({
  baseOptions,
  name: "Verificar raça não aceita",
  options: option.object({
    shopSettings: option.string.layout({
      label: "Configurações da loja",
      isRequired: true,
      helperText: "Configurações da loja (contém as raças não aceitas)",
    }),
    breed: option.string.layout({
      label: "Raça selecionada",
      helperText: "Raça escolhida no cadastro (objeto ou id da raça)",
    }),
    pet: option.string.layout({
      label: "Pet selecionado",
      helperText: "Pet já cadastrado escolhido pelo cliente",
    }),
    notAcceptedMessage: option.string.layout({
      label: "Mensagem de raça não aceita",
      defaultValue: defaultNotAcceptedMessage,
      helperText:
        "Mensagem enviada ao cliente antes de encaminhar ao atendente",
    }),
    isBreedNotAccepted: option.string.layout({
      label: "Raça não aceita",
      isRequired: true,
      helperText: "Recebe true quando a raça não é atendida pela loja",
      inputType: "variableDropdown",
    }),
    breedNotAcceptedMessage: option.string.layout({
      label: "Mensagem de raça não aceita (saída)",
      helperText: "Recebe a mensagem a ser exibida quando a raça é bloqueada",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ isBreedNotAccepted, breedNotAcceptedMessage }) => {
    const variables = [];

    if (isBreedNotAccepted) variables.push(isBreedNotAccepted);

    if (breedNotAcceptedMessage) variables.push(breedNotAcceptedMessage);

    return variables;
  },
});

/**
 * A loja marca as raças que não atende em Configurações > Geral, e o servidor
 * guarda essa escolha em `shop.notAcceptedBreeds` — é essa lista que o produto
 * usa no tecpet-web para bloquear cadastro e agendamento. A flag `notAccepted`
 * da própria raça é legado de 2019 e nenhuma tela grava nela, por isso a
 * verificação aqui é feita contra a lista da loja, que chega no fluxo dentro de
 * `shopSettings` (ação "Configurações da Loja").
 */
export const VerifyNotAcceptedBreedHandler = async ({
  options,
  variables,
}: {
  options: Record<string, unknown>;
  variables: any;
}) => {
  try {
    const shopSettings = safeJsonParse<Partial<PaShopConfigurationsResponse>>(
      options.shopSettings,
      {},
    );

    const notAcceptedBreeds = (shopSettings.notAcceptedBreeds ?? []).map(
      Number,
    );

    const breed = safeJsonParse<Partial<{ id: number | string }> | number>(
      options.breed,
      options.breed as number,
    );

    const pet = safeJsonParse<Partial<PaPetResponse>>(options.pet, {});

    const breedId = Number(
      typeof breed === "object" && breed !== null
        ? breed.id
        : (breed ?? pet.breedId),
    );

    const isBreedNotAccepted =
      Number.isFinite(breedId) && notAcceptedBreeds.includes(breedId);

    const message =
      (options.notAcceptedMessage as string) || defaultNotAcceptedMessage;

    logHandler("verifyNotAcceptedBreed", {
      breedId: Number.isFinite(breedId) ? breedId : null,
      origin:
        typeof breed === "object" || options.breed
          ? "raça selecionada"
          : "pet selecionado",
      notAcceptedBreeds,
      isBreedNotAccepted,
      // Sem a lista da loja não há como bloquear: seguimos o fluxo e registramos
      // o motivo, em vez de barrar um cliente por falha de configuração.
      reason: notAcceptedBreeds.length
        ? isBreedNotAccepted
          ? "raça está na lista de não aceitas da loja"
          : "raça atendida pela loja"
        : "loja sem raças bloqueadas (ou configurações ausentes) — não bloqueia",
    });

    variables.set([
      { id: options.isBreedNotAccepted as string, value: isBreedNotAccepted },
    ]);

    if (options.breedNotAcceptedMessage) {
      variables.set([
        {
          id: options.breedNotAcceptedMessage as string,
          value: isBreedNotAccepted ? message : "",
        },
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};
