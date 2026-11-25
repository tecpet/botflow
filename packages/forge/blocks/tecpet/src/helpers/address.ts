import { isButtonAnswer, onlyDigits, toKey } from "./clientFields";

/** CEP com 8 dígitos, ou `null`. Aceita "01310-100", "01.310-100" e espaços. */
export const normalizeCep = (value: unknown): string | null => {
  const digits = onlyDigits(value);
  return digits.length === 8 ? digits : null;
};

/** "01310100" → "01310-100", o mesmo formato que a tecpet-web grava. */
export const formatCep = (cep: string): string =>
  /^\d{8}$/.test(cep) ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

const NO_COMPLEMENT = new Set([
  "",
  "nao",
  "n",
  "nao tenho",
  "nao tem",
  "nao possui",
  "nenhum",
  "nenhuma",
  "sem",
  "sem complemento",
  "nada",
  "-",
  "0",
  "x",
]);

/**
 * Complemento digitado, ou "" quando o cliente respondeu que não tem ou tocou
 * num botão de uma mensagem anterior ("Sim", "Pular").
 */
export const normalizeComplement = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  return NO_COMPLEMENT.has(toKey(text)) || isButtonAnswer(text) ? "" : text;
};

const NO_NUMBER = new Set(["sn", "s/n", "s n", "sem numero", "sem n", "0"]);

/** Número digitado; "sem número" e variações viram "S/N". */
export const normalizeAddressNumber = (value: unknown): string => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  return NO_NUMBER.has(toKey(text)) ? "S/N" : text;
};

type AddressParts = {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  uf?: string | null;
  zipCode?: string | null;
};

const clean = (value?: string | null) => (value ?? "").trim();

/**
 * Endereço numa linha para mostrar ao cliente, pulando as partes vazias:
 * "Avenida Paulista, 1000 - Apto 12 - Bela Vista - São Paulo/SP".
 * Com `withZipCode`, acrescenta " - CEP 01310-100".
 */
export const formatAddressLine = (
  address: AddressParts,
  { withZipCode = false }: { withZipCode?: boolean } = {},
): string => {
  const street = [clean(address.street), clean(address.number)]
    .filter(Boolean)
    .join(", ");
  const cityUf = [clean(address.city), clean(address.uf)]
    .filter(Boolean)
    .join("/");
  const zipDigits = normalizeCep(address.zipCode);
  const parts = [
    street,
    clean(address.complement),
    clean(address.neighborhood),
    cityUf,
    withZipCode && zipDigits ? `CEP ${formatCep(zipDigits)}` : "",
  ];
  return parts.filter(Boolean).join(" - ");
};
