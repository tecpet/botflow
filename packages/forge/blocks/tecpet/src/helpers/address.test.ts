import { describe, expect, it } from "bun:test";
import {
  formatAddressLine,
  formatCep,
  normalizeAddressNumber,
  normalizeCep,
  normalizeComplement,
} from "./address";

describe("normalizeCep", () => {
  it("aceita CEP com ou sem máscara", () => {
    expect(normalizeCep("01310-100")).toBe("01310100");
    expect(normalizeCep(" 01.310-100 ")).toBe("01310100");
    expect(normalizeCep("01310100")).toBe("01310100");
  });

  it("recusa o que não tem 8 dígitos", () => {
    expect(normalizeCep("0131010")).toBeNull();
    expect(normalizeCep("013101000")).toBeNull();
    expect(normalizeCep("rua das flores")).toBeNull();
    expect(normalizeCep(undefined)).toBeNull();
  });
});

describe("formatCep", () => {
  it("põe o traço como a tecpet-web", () => {
    expect(formatCep("01310100")).toBe("01310-100");
  });
});

describe("normalizeComplement", () => {
  it("guarda o complemento digitado", () => {
    expect(normalizeComplement(" Apto 12  bloco B ")).toBe("Apto 12 bloco B");
  });

  it("trata as respostas de quem não tem complemento como vazio", () => {
    for (const answer of [
      "não",
      "Nao.",
      "N",
      "não tenho",
      "Sem complemento",
      "-",
      "nenhum",
    ]) {
      expect(normalizeComplement(answer)).toBe("");
    }
  });

  it("não grava resposta de botão antigo como complemento", () => {
    expect(normalizeComplement("Sim")).toBe("");
    expect(normalizeComplement("Pular")).toBe("");
    expect(normalizeComplement("Digitar outro CEP")).toBe("");
  });
});

describe("normalizeAddressNumber", () => {
  it("guarda o número digitado", () => {
    expect(normalizeAddressNumber(" 1000 ")).toBe("1000");
    expect(normalizeAddressNumber("12A")).toBe("12A");
  });

  it("padroniza sem número como S/N", () => {
    for (const answer of ["s/n", "SN", "sem número", "Sem numero"]) {
      expect(normalizeAddressNumber(answer)).toBe("S/N");
    }
  });
});

describe("formatAddressLine", () => {
  const address = {
    street: "Avenida Paulista",
    number: "1000",
    complement: "Apto 12",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    uf: "SP",
    zipCode: "01310100",
  };

  it("monta o endereço em uma linha", () => {
    expect(formatAddressLine(address)).toBe(
      "Avenida Paulista, 1000 - Apto 12 - Bela Vista - São Paulo/SP",
    );
  });

  it("acrescenta o CEP quando pedido", () => {
    expect(formatAddressLine(address, { withZipCode: true })).toBe(
      "Avenida Paulista, 1000 - Apto 12 - Bela Vista - São Paulo/SP - CEP 01310-100",
    );
  });

  it("pula as partes vazias, como no CEP único de cidade pequena", () => {
    expect(
      formatAddressLine({
        street: "",
        neighborhood: "",
        city: "Ibiúna",
        uf: "SP",
      }),
    ).toBe("Ibiúna/SP");
  });
});
