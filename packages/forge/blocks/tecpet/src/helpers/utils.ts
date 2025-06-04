export const levenshtein = (a, b) => {
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

export const getSimilarBreeds = (input, breeds, limit = 3) => {
  const normalized = input.toLowerCase().trim();

  return breeds
    .map((breed) => ({
      breed,
      distance: levenshtein(normalized, breed.toLowerCase()),
    }))
    .filter((item) => item.distance <= limit)
    .sort((a, b) => a.distance - b.distance)
    .map((item) => item.breed);
};
