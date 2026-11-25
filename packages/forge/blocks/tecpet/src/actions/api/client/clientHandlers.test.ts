import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as realSdk from "@tec.pet/tecpet-sdk";

const calls: { edit: unknown[][]; lookupCep: string[] } = {
  edit: [],
  lookupCep: [],
};
let editResponse: unknown = null;
let editError: unknown = null;
let lookupResponse: unknown = null;

class FakeTecpetSDK {
  client = {
    edit: async (...args: unknown[]) => {
      calls.edit.push(args);
      if (editError) throw editError;
      return editResponse;
    },
  };
  cep = {
    lookupCep: async (cep: string) => {
      calls.lookupCep.push(cep);
      return lookupResponse;
    },
  };
}

mock.module("@tec.pet/tecpet-sdk", () => ({
  ...realSdk,
  TecpetSDK: FakeTecpetSDK,
}));

const { EditClientHandler } = await import("./editClient");
const { EditClientAddressHandler } = await import("./editClientAddress");
const { LookupAddressByCepHandler } = await import("../cep/lookupAddressByCep");

const credentials = { baseUrl: "http://api", apiKey: "key" };

const makeVariables = () => {
  const values: Record<string, unknown> = {};
  return {
    values,
    set: (items: { id: string; value: unknown }[]) => {
      for (const { id, value } of items) values[id] = value;
    },
  };
};

beforeEach(() => {
  calls.edit = [];
  calls.lookupCep = [];
  editResponse = null;
  editError = null;
  lookupResponse = null;
});

describe("EditClientHandler", () => {
  it("manda o CPF só com dígitos e não manda nome que é resposta de botão", async () => {
    editResponse = {
      name: "Renata Souza",
      cpf: "52998224725",
      birthDate: null,
    };
    const variables = makeVariables();

    await EditClientHandler({
      credentials,
      options: {
        shopId: 225,
        clientId: 1943712,
        clientName: "Sim",
        clientCpf: "529.982.247-25",
        editedClientName: "varNome",
        editedClientCpf: "varCpf",
      },
      variables,
    });

    expect(calls.edit).toEqual([[1943712, { cpf: "52998224725" }, 225]]);
    expect(variables.values.varNome).toBe("Renata Souza");
    expect(variables.values.varCpf).toBe("52998224725");
  });

  it("não chama a API quando não sobra campo válido", async () => {
    await EditClientHandler({
      credentials,
      options: { shopId: 1, clientId: 2, clientName: "", clientCpf: "" },
      variables: makeVariables(),
    });

    expect(calls.edit).toEqual([]);
  });

  it("corrige só o nome quando o cliente ainda não tem CPF", async () => {
    editResponse = { name: "Renata Souza", cpf: null, birthDate: null };

    await EditClientHandler({
      credentials,
      options: {
        shopId: 1,
        clientId: 2,
        clientName: "Renata Souza",
        clientCpf: "",
      },
      variables: makeVariables(),
    });

    expect(calls.edit).toEqual([[2, { name: "Renata Souza" }, 1]]);
  });
});

describe("EditClientAddressHandler", () => {
  it("manda só o endereço, já limpo", async () => {
    editResponse = {
      address: {
        street: "Avenida Paulista",
        number: "S/N",
        complement: "",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        uf: "SP",
        zipCode: "01310-100",
      },
    };
    const variables = makeVariables();

    await EditClientAddressHandler({
      credentials,
      options: {
        shopId: 3365,
        clientId: 10,
        zipCode: "01310100",
        street: " Avenida  Paulista ",
        number: "sem número",
        complement: "não",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        uf: "sp",
        saved: "varSalvo",
        editedClientAddress: "varEndereco",
      },
      variables,
    });

    expect(calls.edit).toEqual([
      [
        10,
        {
          address: {
            zipCode: "01310-100",
            street: "Avenida Paulista",
            number: "S/N",
            complement: "",
            neighborhood: "Bela Vista",
            city: "São Paulo",
            uf: "SP",
          },
        },
        3365,
      ],
    ]);
    expect(variables.values.varSalvo).toBe(true);
    expect(variables.values.varEndereco).toBe(
      "Avenida Paulista, S/N - Bela Vista - São Paulo/SP - CEP 01310-100",
    );
  });

  it("não chama a API sem CEP válido", async () => {
    const variables = makeVariables();

    await EditClientAddressHandler({
      credentials,
      options: { shopId: 1, clientId: 2, zipCode: "123", saved: "varSalvo" },
      variables,
    });

    expect(calls.edit).toEqual([]);
    expect(variables.values.varSalvo).toBe(false);
  });

  it("marca como não salvo quando a API falha", async () => {
    const variables = makeVariables();
    editError = { statusCode: 400, message: ["Bad Request"] };

    await EditClientAddressHandler({
      credentials,
      options: {
        shopId: 1,
        clientId: 2,
        zipCode: "01310-100",
        saved: "varSalvo",
      },
      variables,
    });

    expect(variables.values.varSalvo).toBe(false);
  });
});

describe("LookupAddressByCepHandler", () => {
  const outputs = {
    found: "vFound",
    zipCode: "vCep",
    street: "vRua",
    neighborhood: "vBairro",
    city: "vCidade",
    uf: "vUf",
    formattedAddress: "vFormatado",
  };

  it("preenche o endereço do CEP encontrado", async () => {
    lookupResponse = {
      zipCode: "01310100",
      street: "Avenida Paulista",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      uf: "SP",
    };
    const variables = makeVariables();

    await LookupAddressByCepHandler({
      credentials,
      options: { cepInputText: "01310-100", ...outputs },
      variables,
    });

    expect(calls.lookupCep).toEqual(["01310100"]);
    expect(variables.values).toEqual({
      vFound: true,
      vCep: "01310-100",
      vRua: "Avenida Paulista",
      vBairro: "Bela Vista",
      vCidade: "São Paulo",
      vUf: "SP",
      vFormatado: "Avenida Paulista - Bela Vista - São Paulo/SP",
    });
  });

  it("não busca o que não tem 8 dígitos", async () => {
    const variables = makeVariables();

    await LookupAddressByCepHandler({
      credentials,
      options: { cepInputText: "rua das flores 10", ...outputs },
      variables,
    });

    expect(calls.lookupCep).toEqual([]);
    expect(variables.values.vFound).toBe(false);
  });

  it("limpa o resultado anterior quando o CEP não existe", async () => {
    const variables = makeVariables();
    variables.values.vRua = "Rua antiga";

    await LookupAddressByCepHandler({
      credentials,
      options: { cepInputText: "99999-999", ...outputs },
      variables,
    });

    expect(calls.lookupCep).toEqual(["99999999"]);
    expect(variables.values.vFound).toBe(false);
    expect(variables.values.vRua).toBe("");
  });
});
