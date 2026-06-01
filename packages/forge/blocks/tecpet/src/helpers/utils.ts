export const levenshtein = (a: string, b: string) => {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1, // inserção
          matrix[i - 1][j] + 1, // remoção
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const normalize = (s: string) =>
  s
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const similarityScore = (a: string, b: string) => {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);

  return 1 - distance / maxLen; // score entre 0 e 1
};

export const getSimilarBreeds = (
  input: string,
  breeds: Array<{ name: string; [k: string]: any }>,
) => {
  const inputNorm = normalize(input);

  const scored = breeds.map((breed) => {
    const breedNorm = normalize(breed.name);

    // 🔥 quebra em palavras
    const words = breedNorm.split(" ");

    // pega melhor score entre nome completo e palavras individuais
    const scores = [
      similarityScore(inputNorm, breedNorm),
      ...words.map((w) => similarityScore(inputNorm, w)),
    ];

    const bestScore = Math.max(...scores);

    return {
      breed,
      score: bestScore,
    };
  });

  // 🔥 threshold inteligente
  const filtered = scored
    .filter((b) => b.score >= 0.6) // 60% similaridade
    .sort((a, b) => b.score - a.score);

  return filtered.slice(0, 5).map((b) => b.breed);
};

export const formatAsCurrency = (valor: number) => {
  return valor.toFixed(2).replace(".", ",");
};

export const formatISODate = (d: Date) => {
  return d.toISOString().split("T")[0];
};

export const formatBRDate = (iso: string): string => {
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

export function formatBRDateStringDayMonth(dateStr: string): string {
  const [day, month] = dateStr.split("/");
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
}
export function parseJsonArray<T>(raw: unknown): T[] {
  const arr: unknown[] =
    typeof raw === "string" ? JSON.parse(raw) : ((raw as unknown[]) ?? []);
  return arr.map((item) =>
    typeof item === "string" ? JSON.parse(item) : item,
  ) as T[];
}

export const parseIds = (raw: unknown): number[] => {
  if (Array.isArray(raw)) return raw.map(Number);

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw).map(Number);
    } catch {
      throw new Error("IDs malformados: não é JSON válido");
    }
  }

  throw new Error("IDs malformados: esperado array ou string JSON");
};
