import { TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import {
  formatAddressLine,
  formatCep,
  normalizeCep,
} from "../../../helpers/address";
import { logHandler } from "../../../helpers/logger";

/**
 * Busca o endereço de um CEP digitado pelo cliente (TP-4952). Usa a rota
 * `GET /v1/cep/:cep` da Public API pelo SDK, que já tem cache de 30 dias.
 * Um CEP único de cidade pequena volta sem rua e sem bairro: o fluxo confere
 * se `Rua` está vazia para perguntar os dois.
 */
export const lookupAddressByCep = createAction({
  auth,
  baseOptions,
  name: "Buscar endereço pelo CEP",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      helperText: "Só para o log",
    }),
    cepInputText: option.string.layout({
      label: "CEP digitado",
      isRequired: true,
    }),
    found: option.string.layout({
      label: "Encontrado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    zipCode: option.string.layout({
      label: "CEP (00000-000)",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    street: option.string.layout({
      label: "Rua",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    neighborhood: option.string.layout({
      label: "Bairro",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    city: option.string.layout({
      label: "Cidade",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    uf: option.string.layout({
      label: "UF",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    formattedAddress: option.string.layout({
      label: "Endereço formatado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({
    found,
    zipCode,
    street,
    neighborhood,
    city,
    uf,
    formattedAddress,
  }) =>
    [found, zipCode, street, neighborhood, city, uf, formattedAddress].filter(
      (id): id is string => Boolean(id),
    ),
});

export const LookupAddressByCepHandler = async ({
  credentials,
  options,
  variables,
}: {
  credentials: Record<string, unknown>;
  options: Record<string, unknown>;
  variables: any;
}) => {
  const setVar = (id: unknown, value: unknown) => {
    if (typeof id === "string" && id) variables.set([{ id, value }]);
  };

  // Limpa o resultado da tentativa anterior antes de buscar de novo.
  const setResult = (result: {
    found: boolean;
    zipCode?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    uf?: string;
  }) => {
    setVar(options.found, result.found);
    setVar(options.zipCode, result.zipCode ?? "");
    setVar(options.street, result.street ?? "");
    setVar(options.neighborhood, result.neighborhood ?? "");
    setVar(options.city, result.city ?? "");
    setVar(options.uf, result.uf ?? "");
    setVar(
      options.formattedAddress,
      result.found ? formatAddressLine(result) : "",
    );
  };

  const shopId = Number(options.shopId) || null;
  const cep = normalizeCep(options.cepInputText);

  try {
    if (!cep) {
      logHandler("lookupAddressByCep", {
        shopId,
        found: false,
        reason: "CEP sem 8 dígitos",
      });
      setResult({ found: false });
      return;
    }

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const address = await tecpetSdk.cep.lookupCep(cep);

    if (!address) {
      logHandler("lookupAddressByCep", {
        shopId,
        cep,
        found: false,
        reason: "CEP não encontrado",
      });
      setResult({ found: false });
      return;
    }

    const result = {
      found: true,
      zipCode: formatCep(cep),
      street: address.street?.trim() ?? "",
      neighborhood: address.neighborhood?.trim() ?? "",
      city: address.city?.trim() ?? "",
      uf: address.uf?.trim() ?? "",
    };

    logHandler("lookupAddressByCep", {
      shopId,
      cep,
      found: true,
      hasStreet: Boolean(result.street),
      hasNeighborhood: Boolean(result.neighborhood),
      city: result.city,
      uf: result.uf,
    });

    setResult(result);
  } catch (error) {
    logHandler("lookupAddressByCep", {
      shopId,
      cep,
      found: false,
      failed: true,
    });
    console.error(error);
    setResult({ found: false });
  }
};
