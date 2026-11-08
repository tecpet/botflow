import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { PaBreedResponse } from "@tec.pet/tecpet-sdk";

let listBreeds: () => Promise<PaBreedResponse[]>;

const realSdk = await import("@tec.pet/tecpet-sdk");
mock.module("@tec.pet/tecpet-sdk", () => ({
  ...realSdk,
  TecpetSDK: class {
    breed = { list: () => listBreeds() };
  },
}));

const { GetBreedsHandler } = await import("./getBreeds");
const { VerifySimilarBreedOptionSelectedHandler } = await import(
  "../../validations/verifySimilarBreedOptionSelected"
);

const DOG = "57f243d4-d506-4fe7-9ee0-1f00021f2155";

const breed = (id: number, name: string): PaBreedResponse =>
  ({
    id,
    name,
    hair: "SHORT",
    size: "SMALL",
    specie: "DOG",
    specieId: DOG,
    notAccepted: false,
  }) as unknown as PaBreedResponse;

const shihTzu = breed(95392, "Shih-tzu");
const bichonMaltes = breed(95157, "Bichon Maltês");
const maltes = breed(95298, "Maltês");
const poodle = breed(95320, "Poodle");

// Loja 304: o SRD foi renomeado para faixas de peso.
const srdBands = [
  breed(189138, "Srd 5Kg Á 12Kg"),
  breed(189134, "Srd 13Kg 20 Kg"),
  breed(189135, "Srd 21Kg 30 Kg"),
  breed(189136, "Srd 31Kg 40 Kg"),
  breed(189137, "Srd 41 Kg 60 Kg"),
];

const options = {
  shopId: "304",
  specie: DOG,
  breeds: "racas",
  breedValues: "racasValores",
  breedsNames: "racasNomes",
  petSRD: "petSRD",
};

const createVariables = () => {
  const values: Record<string, unknown> = {};
  return {
    values,
    set: (vars: { id: string; value: unknown }[]) => {
      for (const v of vars) values[v.id] = v.value;
    },
  };
};

// Busca a raça e roda a verificação seguinte, como o grupo "Exibir raças
// parecidas" do fluxo faz (as variáveis chegam como texto via {{...}}).
const searchBreed = async (name: string, petBreedBefore?: unknown) => {
  const variables = createVariables();
  if (petBreedBefore !== undefined) variables.values.petRaca = petBreedBefore;

  await GetBreedsHandler({
    credentials: { apiKey: "key" },
    options: { ...options, name },
    variables,
  });

  const { petSRD, racas } = variables.values;
  await VerifySimilarBreedOptionSelectedHandler({
    options: {
      similarBreeds: JSON.stringify(racas),
      petSRD: petSRD ? JSON.stringify(petSRD) : "",
      petBreed: "petRaca",
    },
    variables,
  });

  return variables.values;
};

// Regra do fluxo para "Sem.Raca.Encontrada" com a troca de `=== 1` para `<= 1`.
const noBreedFound = (racasValores: unknown) =>
  !Array.isArray(racasValores) || racasValores.length <= 1;

describe("getBreeds + verificar raça similar", () => {
  beforeEach(() => {
    listBreeds = async () => [];
  });

  describe("loja com um único SRD", () => {
    const srd = breed(1, "SRD - Sem raça definida");

    beforeEach(() => {
      listBreeds = async () => [bichonMaltes, maltes, poodle, srd];
    });

    it("acrescenta o SRD no fim da lista e grava Pet.SRD", async () => {
      const values = await searchBreed("Maltês");

      expect(values.racasNomes).toEqual([
        "Bichon Maltês",
        "Maltês",
        "SRD - Sem Raça Definida",
      ]);
      expect((values.petSRD as PaBreedResponse).id).toBe(srd.id);
      expect(values.petRaca).toBe("");
      expect(noBreedFound(values.racasValores)).toBe(false);
    });

    it("acha o SRD sem diferenciar maiúsculas", async () => {
      const lowerSrd = breed(2, "Srd");
      listBreeds = async () => [poodle, lowerSrd];

      const values = await searchBreed("Poodle");

      expect((values.petSRD as PaBreedResponse).id).toBe(lowerSrd.id);
      // Só uma raça parecida além do SRD: selecionada automaticamente.
      expect((values.petRaca as PaBreedResponse).id).toBe(poodle.id);
    });

    it("sem raça parecida, a lista fica só com o SRD e o fluxo pede de novo", async () => {
      const values = await searchBreed("Quatree super premium");

      expect(values.racasNomes).toEqual(["SRD - Sem Raça Definida"]);
      expect(values.petRaca).toBe("");
      expect(noBreedFound(values.racasValores)).toBe(true);
    });
  });

  describe("loja com vários SRD (loja 304)", () => {
    beforeEach(() => {
      listBreeds = async () => [shihTzu, bichonMaltes, maltes, ...srdBands];
    });

    it("não acrescenta nenhum SRD e deixa Pet.SRD vazio", async () => {
      const values = await searchBreed("Maltês");

      expect(values.racasNomes).toEqual(["Bichon Maltês", "Maltês"]);
      expect(values.petSRD).toBeNull();
      expect(values.petRaca).toBe("");
      expect(noBreedFound(values.racasValores)).toBe(false);
    });

    it("com uma raça parecida, seleciona ela em vez de tirar a última da lista", async () => {
      const values = await searchBreed("Shitzu");

      expect(values.racasNomes).toEqual(["Shih-tzu"]);
      expect((values.petRaca as PaBreedResponse).id).toBe(shihTzu.id);
    });

    it("quem digita SRD recebe as faixas para escolher", async () => {
      const values = await searchBreed("SRD");

      expect(values.racasNomes).toEqual(
        expect.arrayContaining(srdBands.map((b) => b.name)),
      );
      expect(values.racasNomes).toHaveLength(5);
      expect(values.petRaca).toBe("");
      expect(noBreedFound(values.racasValores)).toBe(false);
    });

    it("sem raça parecida, grava listas vazias e o fluxo pede de novo", async () => {
      const values = await searchBreed("Quatree super premium");

      expect(values.racas).toEqual([]);
      expect(values.racasValores).toEqual([]);
      expect(values.racasNomes).toEqual([]);
      expect(noBreedFound(values.racasValores)).toBe(true);
    });
  });

  it("loja sem SRD: grava listas vazias quando nada parece (loja 1514)", async () => {
    listBreeds = async () => [
      breed(10, "Persa"),
      breed(11, "Siamês"),
      breed(12, "Maine Coon"),
      breed(13, "Angorá"),
    ];

    const values = await searchBreed("Vira-lata");

    expect(values.racasNomes).toEqual([]);
    expect(values.petSRD).toBeNull();
    expect(noBreedFound(values.racasValores)).toBe(true);
  });

  it("espécie sem raças: grava listas vazias (loja 3642)", async () => {
    const values = await searchBreed("Abissínio-porquinho da índia");

    expect(values.racasValores).toEqual([]);
    expect(values.racasNomes).toEqual([]);
    expect(values.petSRD).toBeNull();
    expect(noBreedFound(values.racasValores)).toBe(true);
  });

  it("erro na API: grava listas vazias em vez de deixar as variáveis indefinidas", async () => {
    listBreeds = async () => {
      throw new Error("timeout");
    };

    const values = await searchBreed("Poodle");

    expect(values.racasValores).toEqual([]);
    expect(values.racasNomes).toEqual([]);
    expect(values.petSRD).toBeNull();
  });

  it("limpa uma raça que sobrou de busca anterior quando nada parece", async () => {
    listBreeds = async () => [poodle];

    const values = await searchBreed("Quatree super premium", poodle);

    expect(values.petRaca).toBe("");
  });
});
