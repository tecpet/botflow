import { type PaEditClientInput, TecpetSDK } from "@tec.pet/tecpet-sdk";
import { createAction, option } from "@typebot.io/forge";
import { auth } from "../../../auth";
import { baseOptions, tecpetDefaultBaseUrl } from "../../../constants";
import {
  formatAddressLine,
  formatCep,
  normalizeAddressNumber,
  normalizeCep,
  normalizeComplement,
} from "../../../helpers/address";
import { logHandler } from "../../../helpers/logger";

/**
 * Grava o endereço coletado pelo bot no cadastro do cliente (TP-4952).
 *
 * Manda só `{ address }`: o "Editar um cliente" sempre envia nome e CPF, e um
 * deles vazio derruba a edição com 400. O servidor junta o endereço novo com o
 * que o cliente já tinha, campo a campo.
 */
export const editClientAddress = createAction({
  auth,
  baseOptions,
  name: "Atualizar endereço do cliente",
  options: option.object({
    shopId: option.number.layout({
      label: "Id da loja",
      isRequired: true,
    }),
    clientId: option.number.layout({
      label: "Id do cliente",
      isRequired: true,
    }),
    zipCode: option.string.layout({ label: "CEP", isRequired: true }),
    street: option.string.layout({ label: "Rua" }),
    number: option.string.layout({ label: "Número" }),
    complement: option.string.layout({
      label: "Complemento",
      helperText: '"não", "nenhum", "-" e parecidos são gravados vazios',
    }),
    neighborhood: option.string.layout({ label: "Bairro" }),
    city: option.string.layout({ label: "Cidade" }),
    uf: option.string.layout({ label: "UF" }),
    saved: option.string.layout({
      label: "Endereço salvo",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
    editedClientAddress: option.string.layout({
      label: "Endereço do cliente editado",
      placeholder: "Selecione",
      inputType: "variableDropdown",
    }),
  }),
  getSetVariableIds: ({ saved, editedClientAddress }) =>
    [saved, editedClientAddress].filter((id): id is string => Boolean(id)),
});

const text = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

export const EditClientAddressHandler = async ({
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

  const shopId = Number(options.shopId);
  const clientId = Number(options.clientId);
  const cep = normalizeCep(options.zipCode);

  try {
    if (!cep || !clientId) {
      logHandler("editClientAddress", {
        shopId,
        clientId,
        saved: false,
        reason: !cep ? "CEP sem 8 dígitos" : "sem cliente",
      });
      setVar(options.saved, false);
      return;
    }

    const address: NonNullable<PaEditClientInput["address"]> = {
      zipCode: formatCep(cep),
      street: text(options.street),
      number: normalizeAddressNumber(options.number),
      complement: normalizeComplement(options.complement),
      neighborhood: text(options.neighborhood),
      city: text(options.city),
      uf: text(options.uf).toUpperCase(),
    };

    logHandler("editClientAddress", {
      shopId,
      clientId,
      cep,
      hasStreet: Boolean(address.street),
      hasNumber: Boolean(address.number),
      hasComplement: Boolean(address.complement),
      hasNeighborhood: Boolean(address.neighborhood),
      city: address.city,
      uf: address.uf,
    });

    const tecpetSdk = new TecpetSDK(
      (credentials.baseUrl as string) ?? tecpetDefaultBaseUrl,
      credentials.apiKey as string,
    );

    const editedClient = await tecpetSdk.client.edit(
      clientId,
      { address },
      shopId,
    );

    const savedAddress = editedClient?.address ?? address;

    logHandler("editClientAddress", {
      shopId,
      clientId,
      saved: Boolean(editedClient),
    });

    setVar(options.saved, Boolean(editedClient));
    setVar(
      options.editedClientAddress,
      formatAddressLine(savedAddress, { withZipCode: true }),
    );
  } catch (error) {
    logHandler("editClientAddress", {
      shopId,
      clientId,
      saved: false,
      failed: true,
    });
    console.error(error);
    setVar(options.saved, false);
  }
};
