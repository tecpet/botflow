import { describe, expect, it } from "bun:test";
import { sanitizeClientName, sanitizeCpf } from "./clientFields";

describe("sanitizeCpf", () => {
  it("tira pontos e traço do CPF digitado", () => {
    expect(sanitizeCpf("529.982.247-25")).toBe("52998224725");
  });

  it("aceita CPF só com dígitos", () => {
    expect(sanitizeCpf("52998224725")).toBe("52998224725");
  });

  it("acha o CPF quando o cliente manda nome e CPF juntos", () => {
    expect(sanitizeCpf("Marcia\n529.982.247-25")).toBe("52998224725");
  });

  it("não envia CPF vazio, curto ou inválido", () => {
    expect(sanitizeCpf("")).toBeUndefined();
    expect(sanitizeCpf(undefined)).toBeUndefined();
    expect(sanitizeCpf("1234567890")).toBeUndefined();
    expect(sanitizeCpf("111.111.111-11")).toBeUndefined();
    expect(sanitizeCpf("529.982.247-26")).toBeUndefined();
  });
});

describe("sanitizeClientName", () => {
  it("mantém o nome digitado, sem espaços sobrando", () => {
    expect(sanitizeClientName("  Renata   Souza ")).toBe("Renata Souza");
  });

  it("não envia nome vazio ou com menos de 3 letras", () => {
    expect(sanitizeClientName("")).toBeUndefined();
    expect(sanitizeClientName("Jo")).toBeUndefined();
    expect(sanitizeClientName(undefined)).toBeUndefined();
  });

  it("não envia resposta de botão como nome", () => {
    expect(sanitizeClientName("Sim")).toBeUndefined();
    expect(sanitizeClientName("Não")).toBeUndefined();
    expect(sanitizeClientName("NAO!")).toBeUndefined();
    expect(sanitizeClientName("Mais tarde")).toBeUndefined();
  });

  it("aceita nome que começa com Sim", () => {
    expect(sanitizeClientName("Simone")).toBe("Simone");
  });
});
